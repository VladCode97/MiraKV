import { createServer } from "node:net";
import { isPortValid } from "../utils/guard.utils";

const PORT_TERMINAL = Number(process.argv[3]);

if (!isPortValid(PORT_TERMINAL)) {
  throw new Error("Error: Connection");
}

const server = createServer((socket) => {
  console.log("Client connect");
  console.log(process.argv);
  /**
   * Received information <<event>>
   */
  socket.on("data", (data) => {
    const message = data.toString().trim().toUpperCase();
    if (message === "PING") {
      socket.write("PONG");
    }
  });
  /**
   * Disconnected client <<event>>
   */
  socket.on("end", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT_TERMINAL, () =>
  console.log(`MiraKV server listening on port ${PORT_TERMINAL}`),
);
