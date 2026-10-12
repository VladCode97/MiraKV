import { EmbeddedActionsParser, type IToken } from "chevrotain";

import {
  ALL_TOKENS,
  ArrayEnd,
  ArrayStart,
  ArrayType,
  BooleanType,
  BooleanValue,
  Colon,
  Comma,
  DateType,
  DateValue,
  Identifier,
  In,
  Insert,
  NumberType,
  NumberValue,
  ObjectEnd,
  ObjectStart,
  ObjectType,
  StringType,
  StringValue,
} from "../lexer/mirakv-lexer";

import { TParser, TTypedValue } from "../../domain/types/parser.type";

/**
 * Parser for the MiraQL query language.
 *
 * Consumes the token stream produced by `MiraKVLexer` and builds a
 * structured {@link TParser} result. Grammar rules are defined with
 * Chevrotain's {@link EmbeddedActionsParser}, so parsing and value
 * construction happen in a single pass.
 *
 * Exposed as a singleton via {@link Instance}. The grammar currently
 * supports the `INSERT IN <collection>` command with a typed value that
 * may be a primitive, a date, an object, or a homogeneous array.
 *
 * @example
 * const { tokens } = MiraKVLexer.tokenize(`INSERT IN USERS --STRING "Luis"`);
 * const { result, errors } = MiraKVParser.Instance.parse(tokens);
 */
export class MiraKVParser extends EmbeddedActionsParser {
  private static miraKVParser: MiraKVParser;

  private insertCommandRule!: ReturnType<MiraKVParser["insertCommand"]>;
  private typedValueRule!: ReturnType<MiraKVParser["typedValue"]>;
  private objectRule!: ReturnType<MiraKVParser["object"]>;
  private propertyRule!: ReturnType<MiraKVParser["property"]>;
  private primitiveValueRule!: ReturnType<MiraKVParser["primitiveValue"]>;
  private arrayRule!: ReturnType<MiraKVParser["array"]>;
  private arrayValuesRule!: ReturnType<MiraKVParser["arrayValues"]>;
  private stringArrayRule!: ReturnType<MiraKVParser["stringArray"]>;
  private numberArrayRule!: ReturnType<MiraKVParser["numberArray"]>;
  private booleanArrayRule!: ReturnType<MiraKVParser["booleanArray"]>;

  private constructor() {
    super(ALL_TOKENS, { recoveryEnabled: true });

    this.insertCommandRule = this.insertCommand();
    this.typedValueRule = this.typedValue();
    this.objectRule = this.object();
    this.propertyRule = this.property();
    this.primitiveValueRule = this.primitiveValue();
    this.arrayRule = this.array();
    this.arrayValuesRule = this.arrayValues();
    this.stringArrayRule = this.stringArray();
    this.numberArrayRule = this.numberArray();
    this.booleanArrayRule = this.booleanArray();

    this.performSelfAnalysis();
  }

  /**
   * Returns the shared parser instance, creating it on first access.
   *
   * @returns The singleton {@link MiraKVParser}.
   */
  static get Instance(): MiraKVParser {
    if (MiraKVParser.miraKVParser === undefined) {
      MiraKVParser.miraKVParser = new MiraKVParser();
    }

    return MiraKVParser.miraKVParser;
  }

  /**
   * Grammar rule for an insert command.
   *
   * Matches `INSERT IN <Identifier> <typedValue>` and returns the command
   * as a {@link TParser}, merging the collection name with the parsed
   * typed value.
   */
  public insertCommand() {
    return this.RULE("insertCommand", (): TParser => {
      this.CONSUME(Insert);
      this.CONSUME(In);
      const collection = this.CONSUME(Identifier);
      const typedValue = this.SUBRULE(this.typedValueRule);
      return {
        operation: "INSERT",
        collection: collection.image,
        ...typedValue,
      };
    });
  }

  /**
   * Grammar rule for a typed value.
   *
   * Matches a type marker (`--STRING`, `--NUMBER`, etc.) followed by a value
   * of that type, and decodes the value accordingly. Objects and arrays
   * delegate to their own rules.
   */
  private typedValue() {
    return this.RULE("typedValue", (): TTypedValue => {
      return this.OR([
        {
          ALT: () => {
            this.CONSUME(NumberType);
            const token = this.CONSUME(NumberValue);

            return {
              type: "NUMBER" as const,
              value: Number(token.image),
            };
          },
        },
        {
          ALT: () => {
            this.CONSUME(StringType);
            const token = this.CONSUME(StringValue);

            return {
              type: "STRING" as const,
              value: this.ACTION(() => JSON.parse(token.image)),
            };
          },
        },
        {
          ALT: () => {
            this.CONSUME(BooleanType);
            const token = this.CONSUME(BooleanValue);

            return {
              type: "BOOLEAN" as const,
              value: token.image === "true",
            };
          },
        },
        {
          ALT: () => {
            this.CONSUME(DateType);
            const token = this.CONSUME(DateValue);

            return {
              type: "DATE" as const,
              value: this.ACTION(() => new Date(JSON.parse(token.image))),
            };
          },
        },
        {
          ALT: () => {
            this.CONSUME(ObjectType);
            const value = this.SUBRULE(this.objectRule);

            return {
              type: "OBJECT" as const,
              value,
            };
          },
        },
        {
          ALT: () => {
            this.CONSUME(ArrayType);
            const value = this.SUBRULE(this.arrayRule);

            return {
              type: "ARRAY" as const,
              value,
            };
          },
        },
      ]);
    });
  }

  /**
   * Grammar rule for an object literal.
   *
   * Matches `{ property (, property)* }` and merges every property into a
   * single plain object.
   */
  private object() {
    return this.RULE("object", () => {
      this.CONSUME(ObjectStart);

      const firstProperty = this.SUBRULE(this.propertyRule);
      const result = { ...firstProperty };

      this.MANY(() => {
        this.CONSUME(Comma);

        const property = this.SUBRULE2(this.propertyRule);
        Object.assign(result, property);
      });

      this.CONSUME(ObjectEnd);

      return result;
    });
  }

  /**
   * Grammar rule for a single object property.
   *
   * Matches `"key" : primitiveValue` and returns a one-entry object.
   */
  private property() {
    return this.RULE("property", () => {
      const keyToken = this.CONSUME(StringValue);
      const key = this.ACTION(() => JSON.parse(keyToken.image));

      this.CONSUME(Colon);

      const value = this.SUBRULE(this.primitiveValueRule);

      return { [key]: value };
    });
  }

  /**
   * Grammar rule for a primitive value inside an object.
   *
   * Matches a string, number, boolean, or date literal and decodes it to
   * its JavaScript representation.
   */
  private primitiveValue() {
    return this.RULE("primitiveValue", () => {
      return this.OR([
        {
          ALT: () => {
            const token = this.CONSUME(StringValue);
            return this.ACTION(() => JSON.parse(token.image));
          },
        },
        {
          ALT: () => {
            const token = this.CONSUME(NumberValue);
            return Number(token.image);
          },
        },
        {
          ALT: () => {
            const token = this.CONSUME(BooleanValue);
            return token.image === "true";
          },
        },
        {
          ALT: () => {
            const token = this.CONSUME(DateValue);

            return this.ACTION(() => new Date(JSON.parse(token.image)));
          },
        },
      ]);
    });
  }

  /**
   * Grammar rule for an array literal.
   *
   * Matches `[ arrayValues ]`. The element type is inferred from the first
   * element via {@link arrayValues}, enforcing homogeneity.
   */
  private array() {
    return this.RULE("array", () => {
      this.CONSUME(ArrayStart);

      const values = this.SUBRULE(this.arrayValuesRule);

      this.CONSUME(ArrayEnd);

      return values;
    });
  }

  /**
   * Grammar rule that selects an array variant by element type.
   *
   * Dispatches to the string, number, or boolean array rule. Because a
   * single variant is chosen, every element must share the same type —
   * mixed-type arrays are not valid.
   */
  private arrayValues() {
    return this.RULE("arrayValues", () => {
      return this.OR([
        {
          ALT: () => this.SUBRULE(this.stringArrayRule),
        },
        {
          ALT: () => this.SUBRULE(this.numberArrayRule),
        },
        {
          ALT: () => this.SUBRULE(this.booleanArrayRule),
        },
      ]);
    });
  }

  /**
   * Grammar rule for a comma-separated list of string literals.
   */
  private stringArray() {
    return this.RULE("stringArray", () => {
      const firstToken = this.CONSUME(StringValue);

      const values = [this.ACTION(() => JSON.parse(firstToken.image))];

      this.MANY(() => {
        this.CONSUME(Comma);

        const token = this.CONSUME2(StringValue);

        values.push(this.ACTION(() => JSON.parse(token.image)));
      });

      return values;
    });
  }

  /**
   * Grammar rule for a comma-separated list of number literals.
   */
  private numberArray() {
    return this.RULE("numberArray", () => {
      const firstToken = this.CONSUME(NumberValue);
      const values = [Number(firstToken.image)];

      this.MANY(() => {
        this.CONSUME(Comma);

        const token = this.CONSUME2(NumberValue);
        values.push(Number(token.image));
      });

      return values;
    });
  }

  /**
   * Grammar rule for a comma-separated list of boolean literals.
   */
  private booleanArray() {
    return this.RULE("booleanArray", () => {
      const firstToken = this.CONSUME(BooleanValue);
      const values = [firstToken.image === "true"];

      this.MANY(() => {
        this.CONSUME(Comma);

        const token = this.CONSUME2(BooleanValue);
        values.push(token.image === "true");
      });

      return values;
    });
  }

  /**
   * Parses a token stream into a structured MiraQL command.
   *
   * @param tokens - Tokens produced by `MiraKVLexer.tokenize`.
   * @returns An object with the parsed `result` and any `errors` collected
   *          during parsing (empty when the input is valid).
   */
  public parse(tokens: IToken[]) {
    this.input = tokens;
    const result = this.insertCommandRule();
    return {
      result,
      errors: this.errors,
    };
  }
}
