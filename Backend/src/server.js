// Server entry point. Boots the HTTP server and wires graceful shutdown.
import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/prisma.js";

const server = app.listen(env.port, () => {
  console.log(`🚀 Community Hero API running on http://localhost:${env.port}`);
  console.log(`   Environment: ${env.nodeEnv}`);
  console.log(`   Health check: http://localhost:${env.port}/health`);
});

// Graceful shutdown: close HTTP server and DB connections.
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log("Closed out remaining connections.");
    process.exit(0);
  });

  // Force-exit if shutdown hangs.
  setTimeout(() => {
    console.error("Forced shutdown.");
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Rejection:", reason);
});

export default server;
