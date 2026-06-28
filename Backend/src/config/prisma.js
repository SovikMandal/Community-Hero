// Singleton Prisma client. Reuses the instance across hot reloads in dev
// to avoid exhausting database connections.
//
// Neon serverless Postgres aggressively closes idle TCP connections, which
// surfaces as "Error in PostgreSQL connection: Error { kind: Closed }".
// Instead of a raw TCP pool, we use Neon's serverless driver adapter, which
// talks to Neon over WebSockets and transparently re-establishes connections
// after the database auto-suspends. A retry client-extension stays in place
// as a safety net for any remaining transient blips.
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { isDev } from "./env.js";

// The Neon serverless driver needs a WebSocket implementation in Node.
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis;

/** Detects transient connection errors that are safe to retry. */
function isTransientConnectionError(error) {
  return (
    error?.message?.includes("Closed") ||
    error?.message?.includes("connection") ||
    error?.message?.includes("Connection") ||
    error?.code === "P1017" || // server has closed the connection
    error?.code === "P1001" || // can't reach database server
    error?.code === "P1002" // database server timed out
  );
}

/**
 * Builds the extended client with a retry wrapper around every operation.
 *
 * NOTE: Prisma 6 removed the `$use` middleware API. The equivalent is a
 * client extension with a top-level `$allOperations` query hook, which wraps
 * model queries AND raw queries.
 */
function createPrismaClient() {
  const adapter = new PrismaNeon(
    { connectionString: process.env.DATABASE_URL },
    {
      // Log pool/connection blips instead of letting them bubble up as
      // unhandled errors that spam the console or crash the process.
      onPoolError: (e) => console.warn("⚠️  Neon pool error:", e.message),
      onConnectionError: (e) => console.warn("⚠️  Neon connection error:", e.message),
    }
  );

  const base = new PrismaClient({
    adapter,
    log: isDev ? ["warn", "error"] : ["error"],
  });

  return base.$extends({
    name: "retry-on-connection-closed",
    query: {
      async $allOperations({ operation, model, args, query }) {
        const MAX_RETRIES = 3;
        let attempt = 0;

        while (true) {
          try {
            return await query(args);
          } catch (error) {
            attempt++;

            if (isTransientConnectionError(error) && attempt < MAX_RETRIES) {
              const backoffMs = Math.min(100 * 2 ** attempt, 2000);
              console.warn(
                `⚠️  Prisma connection error on ${model ?? "raw"}.${operation} ` +
                  `(attempt ${attempt}/${MAX_RETRIES}). Retrying in ${backoffMs}ms...`
              );
              await new Promise((r) => setTimeout(r, backoffMs));
              continue;
            }

            throw error; // non-connection error or retries exhausted
          }
        }
      },
    },
  });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (isDev) globalForPrisma.prisma = prisma;

export default prisma;
