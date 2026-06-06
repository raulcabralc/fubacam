import { createServer } from "node:http";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const startHealthServer = () => {
  const server = createServer((request, response) => {
    if (request.url === "/health" || request.url === "/") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ok: true, service: "fubacam" }));
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ ok: false }));
  });

  server.listen(env.PORT, () => {
    logger.info("Health server started", { port: env.PORT });
  });

  return server;
};
