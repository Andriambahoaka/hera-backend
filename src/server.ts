// Must stay the first import: loads and validates env before any module
// that reads process.env at import time.
import "./core/config/env.load";

import http from "http";
import { AddressInfo } from "net";
import app from "./app";
import { connectDatabase, disconnectDatabase } from "./core/config/database";
import { APP } from "./core/utils/messages.util";

const port = Number(process.env.PORT || 3000);
app.set("port", port);

const server = http.createServer(app);

// =============================
// Listen errors
// =============================
server.on("error", (error: NodeJS.ErrnoException) => {
  if (error.syscall !== "listen") throw error;

  switch (error.code) {
    case "EACCES":
      console.error(`Port ${port} requires elevated privileges.`);
      process.exit(1);
    case "EADDRINUSE":
      console.error(`Port ${port} is already in use.`);
      process.exit(1);
    default:
      throw error;
  }
});

server.on("listening", () => {
  const address = server.address() as AddressInfo | string;
  const bind = typeof address === "string" ? `pipe ${address}` : `port ${address.port}`;
  console.log(`Listening on ${bind}`);
});

// =============================
// Graceful shutdown
// =============================
const SHUTDOWN_TIMEOUT_MS = 10_000;
let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`${signal} received, shutting down...`);

  // Force exit if in-flight requests don't finish in time.
  setTimeout(() => {
    console.error("Shutdown timed out, forcing exit.");
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();

  server.close(async () => {
    try {
      await disconnectDatabase();
    } finally {
      process.exit(0);
    }
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

// =============================
// Start: connect DB first, then accept traffic
// =============================
connectDatabase(process.env.MONGO_URI!)
  .then(() => server.listen(port, "0.0.0.0"))
  .catch((err) => {
    console.error(APP.MONGO_CONNECTION_ERROR, err.message);
    process.exit(1);
  });
