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

const main = async () => {
  await connectMongo();

  const client = createDiscordClient();
  const provider = createMatchProvider();
  const playerService = new PlayerService(provider);
  const guildSettingsService = new GuildSettingsService();
  const henrikMmrService = new HenrikMmrService();
  const matchService = new MatchService();
  const rankingService = new RankingService();
  const riotAuthService = new RiotAuthService(playerService);
  const trackingService = new TrackingService(client, provider, playerService, matchService, guildSettingsService);

  const context: AppContext = {
    provider,
    playerService,
    guildSettingsService,
    henrikMmrService,
    matchService,
    rankingService,
    riotAuthService,
    trackingService
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
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
