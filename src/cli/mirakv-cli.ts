#!/usr/bin/env bun
import { createInterface } from "node:readline";
import { MiraKVLexer } from "../language/lexer/mirakv-lexer";
import { MiraKVParser } from "../language/parser/mirakv-parser";
// MIRAKV OPERATION IN <<COLECCION>> --TYPE <<VALUE>>

const terminal = createInterface({
  input: process.stdin,
  output: process.stdout,
});
terminal.setPrompt("#MIRAKV: ");
terminal.prompt();

terminal.on("line", (line) => {
  const { tokens, errors } = MiraKVLexer.tokenize(line);
  if (errors.length > 0) {
    console.log("LEXER ERRORS:", errors);
    terminal.prompt();
    return;
  }
  const parser = MiraKVParser.Instance;
  parser.input = tokens;
  parser.insertCommand();
  console.log("PARSER ERRORS:", parser.errors);
  terminal.prompt();
});
