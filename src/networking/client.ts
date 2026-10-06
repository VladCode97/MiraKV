import { createConnection } from "node:net";
import { isPortValid } from "../utils/guard.utils";

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
