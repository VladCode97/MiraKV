/**
 * @file client.ts
 * @description Minimal TCP client for MiraKV.
 *
 * Reads the target port from the command line, validates it, and opens a
 * connection to the local MiraKV server (see {@link network.ts}). Counterpart
 * to the server stub and the starting point for the client networking layer.
 *
 * Usage: `<runtime> client.ts <flag> <port>` — the port is read from
 * `process.argv[3]`.
 */
import { createConnection } from "node:net";
import { isPortValid } from "../utils/guard.utils";

/** Target port, read from the command line (`process.argv[3]`). */
const PORT_TERMINAL = Number(process.argv[3]);

if (!isPortValid(PORT_TERMINAL)) {
  throw new Error("Error: Connection");
}

console.log(`PORT_TERMINAL:::${PORT_TERMINAL}`);

const socket = createConnection({
  host: "localhost",
  port: PORT_TERMINAL,
});

socket.on("connect", () => {
  console.log("Connected to MiraKV");
});
