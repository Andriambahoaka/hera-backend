import http from "http";
import app from "./app";
import { AddressInfo } from "net";


const port = Number(process.env.PORT || 4200);
app.set("port", port);

// =============================
// Error Handler
// =============================
const errorHandler = (error: NodeJS.ErrnoException): void => {
  if (error.syscall !== "listen") {
    throw error;
  }

  const address = server.address();
  const bind =
    typeof address === "string"
      ? `pipe ${address}`
      : `port ${port}`;

  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges.`);
      process.exit(1);
      break;

    case "EADDRINUSE":
      console.error(`${bind} is already in use.`);
      process.exit(1);
      break;

    default:
      throw error;
  }
};

// =============================
// Create Server
// =============================
const server = http.createServer(app);

// =============================
// Events
// =============================
server.on("error", errorHandler);

server.on("listening", () => {
  const address = server.address() as AddressInfo | string;
  const bind =
    typeof address === "string"
      ? `pipe ${address}`
      : `port ${address.port}`;

  console.log(`Listening on ${bind}`);
});

// =============================
// Start Listening
// =============================
server.listen(port, "0.0.0.0");

