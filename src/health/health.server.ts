import { createServer } from "node:http";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const healthServerKey = Symbol.for("fubacam.healthServer");

type GlobalWithHealthServer = typeof globalThis & {
  [healthServerKey]?: ReturnType<typeof createServer>;
};

export const startHealthServer = () => {
  const globalWithHealthServer = globalThis as GlobalWithHealthServer;
  if (globalWithHealthServer[healthServerKey]) return globalWithHealthServer[healthServerKey];

  const server = createServer((request, response) => {
    if (request.url === "/health" || request.url === "/") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: true, service: "fubacam" }));
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: false }));
  });

  globalWithHealthServer[healthServerKey] = server;

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      logger.warn("Health server port is already in use", { port: env.PORT });
      return;
    }

    logger.error("Health server failed", {
      error: error instanceof Error ? error.message : String(error)
    });
  });

  server.listen(env.PORT, () => {
    logger.info("Health server started", { port: env.PORT });
  });

  return server;
};
