#!/usr/bin/env bun
/**
 * @file mirakv-cli.ts
 * @description Interactive REPL for the MiraQL language.
 *
 * Reads MiraQL commands line by line from stdin, tokenizes them with
 * {@link MiraKVLexer}, parses them with {@link MiraKVParser}, and executes
 * the result against a {@link Collection}. Lexer and parser errors are
 * reported without exiting the prompt.
 *
 * Command shapes:
 * ```text
 * INSERT IN <COLLECTION> KEY "<key>" --<TYPE> <VALUE>
 * GET IN <COLLECTION> "<key>"     // fetch one record by key
 * GET IN <COLLECTION>             // fetch all records
 * ```
 *
 * On INSERT, only `OBJECT`-typed values are currently executed. Other value
 * types parse successfully but are rejected at execution time.
 */
import { createInterface } from "node:readline";
import { MiraKVLexer } from "../language/lexer/mirakv-lexer";
import { MiraKVParser } from "../language/parser/mirakv-parser";
import { Collection } from "../collections/collection";

const collection = new Collection<unknown>();

const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
});
terminal.setPrompt("#MIRAKV: ");
terminal.prompt();

terminal.on("line", async (line) => {
  const { tokens, errors } = MiraKVLexer.tokenize(line);
  if (errors.length > 0) {
    console.error("LEXER ERRORS:", errors);
    terminal.prompt();
    return;
  }
  const parser = MiraKVParser.Instance;
  const { result, errors: parserErrors } = parser.parse(tokens);
  if (parserErrors.length > 0) {
    console.error("PARSER ERRORS:", parserErrors);
    terminal.prompt();
    return;
  }

  switch (result.operation) {
    case "INSERT": {
      if (result.type !== "OBJECT") {
        console.error("Only OBJECT values are supported.");
        break;
      }
      await collection.insert(result.value, result.key);
      console.log("INSERT SUCCESSFUL:", result.value);
      break;
    }
    case "GET": {
      if (result.key !== undefined) {
        const found = await collection.findById(result.key);
        console.log("GET:", found);
      } else {
        const all = await collection.find();
        console.log("GET ALL:", all);
      }
      break;
    }
  }

  terminal.prompt();
});
