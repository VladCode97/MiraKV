/**
 * @file network.ts
 * @description Minimal TCP server for MiraKV.
 *
 * Reads the listening port from the command line, validates it, and starts
 * a TCP server. The current protocol is a health-check stub: a `PING`
 * message is answered with `PONG`. This is the entry point for the future
 * client/server networking layer.
 *
 * Usage: `<runtime> network.ts <flag> <port>` — the port is read from
 * `process.argv[3]`.
 */
import { createServer } from "node:net";
import { isPortValid } from "../utils/guard.utils";

/** Listening port, read from the command line (`process.argv[3]`). */
const PORT_TERMINAL = Number(process.argv[3]);

if (!isPortValid(PORT_TERMINAL)) {
  throw new Error("Error: Connection");
}

const server = createServer((socket) => {
  console.log("Client connect");
  console.log(process.argv);

  /**
   * Handles inbound data from the connected client.
   * Normalizes the message and replies to the `PING` health check.
   */
  socket.on("data", (data) => {
    const message = data.toString().trim().toUpperCase();
    if (message === "PING") {
      socket.write("PONG");
    }
  });

  /**
   * Handles client disconnection.
   */
  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT_TERMINAL, () =>
  console.log(`MiraKV server listening on port ${PORT_TERMINAL}`),
);
