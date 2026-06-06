import { env } from "./config/env";
import { startRiotCallbackServer } from "./auth/riot-callback.server";
import { connectMongo } from "./database/mongo";
import { createDiscordClient } from "./discord/client";
import { registerInteractionCreateEvent } from "./discord/events/interaction-create.event";
import { registerReadyEvent } from "./discord/events/ready.event";
import { createMatchProvider } from "./providers/ProviderFactory";
import { startTrackingScheduler } from "./scheduler/tracking.scheduler";
import { AppContext } from "./services/AppContext";
import { GuildSettingsService } from "./services/GuildSettingsService";
import { HenrikMmrService } from "./services/HenrikMmrService";
import { MatchService } from "./services/MatchService";
import { PlayerService } from "./services/PlayerService";
import { RankingService } from "./services/RankingService";
import { RiotAuthService } from "./services/RiotAuthService";
import { TrackingService } from "./services/TrackingService";
import { logger } from "./utils/logger";
import http from "node:http";

const port = Number(process.env.PORT) || 3000;

const main = async () => {
  http
    .createServer((_, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("Fubacam is running\n");
    })
    .listen(port, "0.0.0.0", () => {
      console.log(`[info] Health server listening on port ${port}`);
    });

  await connectMongo();

  const client = createDiscordClient();
  const provider = createMatchProvider();
  const playerService = new PlayerService(provider);
  const guildSettingsService = new GuildSettingsService();
  const henrikMmrService = new HenrikMmrService();
  const matchService = new MatchService();
  const rankingService = new RankingService();
  const riotAuthService = new RiotAuthService(playerService);
  const trackingService = new TrackingService(
    client,
    provider,
    playerService,
    matchService,
    guildSettingsService,
  );

  const context: AppContext = {
    provider,
    playerService,
    guildSettingsService,
    henrikMmrService,
    matchService,
    rankingService,
    riotAuthService,
    trackingService,
  };

  registerReadyEvent(client);
  registerInteractionCreateEvent(client, context);
  startTrackingScheduler(trackingService);
  if (env.RIOT_REDIRECT_URI) {
    startRiotCallbackServer(riotAuthService);
  }

  await client.login(env.DISCORD_TOKEN);
  logger.info("Fubacam started", { provider: provider.getName() });
};

main().catch((error) => {
  logger.error("Fatal boot error", {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
