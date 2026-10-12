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
 * Command shape:
 * ```text
 * <OPERATION> IN <COLLECTION> --<TYPE> <VALUE>
 * ```
 *
 * Only `OBJECT`-typed values are currently executed (inserted). Other
 * value types parse successfully but are rejected at execution time.
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
  if (result.type !== "OBJECT") {
    console.error("Only OBJECT values are supported.");
    terminal.prompt();
    return;
  }
  await collection.insert(result.value);
  console.log("INSERT SUCCESSFUL:", result.value);
  terminal.prompt();
});
