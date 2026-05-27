import http from "node:http";
import { env } from "../config/env";
import { RiotAuthService } from "../services/RiotAuthService";
import { logger } from "../utils/logger";

export const startRiotCallbackServer = (riotAuthService: RiotAuthService) => {
  const server = http.createServer(async (request, response) => {
    const host = request.headers.host ?? `localhost:${env.AUTH_SERVER_PORT}`;
    const url = new URL(request.url ?? "/", `http://${host}`);

    if (url.pathname !== new URL(env.RIOT_REDIRECT_URI ?? "http://localhost").pathname) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state) {
      response.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Missing Riot authorization code or state.");
      return;
    }

    try {
      const player = await riotAuthService.completeAuthorization({ code, state });
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(successHtml(`${player.riotName}#${player.tagLine}`));
    } catch (error) {
      logger.warn("Riot OAuth callback failed", {
        error: error instanceof Error ? error.message : String(error)
      });
      response.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
      response.end(errorHtml(error instanceof Error ? error.message : "Unexpected authorization error"));
    }
  });

  server.listen(env.AUTH_SERVER_PORT, () => {
    logger.info("Riot OAuth callback server started", {
      port: env.AUTH_SERVER_PORT,
      redirectUri: env.RIOT_REDIRECT_URI
    });
  });

  return server;
};

const page = (title: string, message: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #10141f; color: #f4f7fb; display: grid; min-height: 100vh; place-items: center; margin: 0; }
      main { max-width: 520px; padding: 32px; text-align: center; }
      h1 { color: #ff4655; }
      p { line-height: 1.5; }
    </style>
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(message)}</p>
    </main>
  </body>
</html>`;

const successHtml = (riotId: string) => page("Riot account linked", `${riotId} is now linked to Fubacam. You can close this tab.`);
const errorHtml = (message: string) => page("Riot link failed", message);
const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
