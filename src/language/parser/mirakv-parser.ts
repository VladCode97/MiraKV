import { EmbeddedActionsParser } from "chevrotain";
import {
  ALL_TOKENS,
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

export class MiraKVParser extends EmbeddedActionsParser {
  private static miraKVParser: MiraKVParser;

  private constructor() {
    super(ALL_TOKENS, { recoveryEnabled: true });
    this.insertCommand();
    this.type();
    this.value();
    this.object();
    this.property();
    this.primitiveValue();
    this.performSelfAnalysis();
  }

  static get Instance(): MiraKVParser {
    if (MiraKVParser.miraKVParser === undefined) {
      MiraKVParser.miraKVParser = new MiraKVParser();
    }

    return MiraKVParser.miraKVParser;
  }

  public insertCommand() {
    this.RULE("insertCommand", () => {
      this.CONSUME(Insert);
      this.CONSUME(In);
      this.CONSUME(Identifier);
      this.SUBRULE(this.type);
      this.SUBRULE(this.value);
    });
  }

  private type() {
    this.RULE("type", () => {
      this.OR([
        { ALT: () => this.CONSUME(NumberType) },
        { ALT: () => this.CONSUME(StringType) },
        { ALT: () => this.CONSUME(BooleanType) },
        { ALT: () => this.CONSUME(DateType) },
        { ALT: () => this.CONSUME(ObjectType) },
        { ALT: () => this.CONSUME(ArrayType) },
      ]);
    });
  }

  private value() {
    this.RULE("value", () => {
      this.OR([
        { ALT: () => this.CONSUME(NumberValue) },
        { ALT: () => this.CONSUME(StringValue) },
        { ALT: () => this.CONSUME(BooleanValue) },
        { ALT: () => this.CONSUME(DateValue) },
      ]);
    });
  }

  private object() {
    this.RULE("object", () => {
      this.CONSUME(ObjectStart);
      this.SUBRULE(this.property);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.property);
      });
      this.CONSUME(ObjectEnd);
    });
  }

  private property() {
    this.RULE("property", () => {
      this.CONSUME(StringValue);
      this.CONSUME(Colon);
      this.SUBRULE(this.primitiveValue);
    });
  }

  private primitiveValue() {
    this.RULE("primitiveValue", () => {
      this.OR([
        { ALT: () => this.CONSUME(StringValue) },
        { ALT: () => this.CONSUME(NumberValue) },
        { ALT: () => this.CONSUME(BooleanValue) },
        { ALT: () => this.CONSUME(DateValue) },
      ]);
    });
  }
}
