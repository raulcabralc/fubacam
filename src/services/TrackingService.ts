import { Client } from "discord.js";
import { env } from "../config/env";
import { GuildSettingsModel } from "../database/models/GuildSettings.model";
import { PlayerModel } from "../database/models/Player.model";
import { isHenrikRateLimited } from "../providers/henrik-rate-limit";
import { MatchProvider } from "../providers/MatchProvider";
import { GuildSettingsService } from "./GuildSettingsService";
import { MatchService } from "./MatchService";
import { PlayerService } from "./PlayerService";
import { logger } from "../utils/logger";
import { sleep } from "../utils/sleep";

export class TrackingService {
  private active = false;
  private lastRunAt?: Date;

  constructor(
    private readonly client: Client,
    private readonly provider: MatchProvider,
    private readonly playerService: PlayerService,
    private readonly matchService: MatchService,
    private readonly guildSettingsService: GuildSettingsService
  ) {}

  getStatus() {
    return {
      active: this.active,
      provider: this.provider.getName(),
      lastRunAt: this.lastRunAt
    };
  }

  async runOnce() {
    if (this.active) return;
    this.active = true;
    this.lastRunAt = new Date();

    try {
      const settings = await GuildSettingsModel.find({
        trackingEnabled: true,
        ...(env.DISCORD_GUILD_ID ? { guildId: env.DISCORD_GUILD_ID } : {})
      });

      for (const guild of settings) {
        await this.trackGuild(guild.guildId);
        await this.guildSettingsService.setLastTrackingCheck(guild.guildId, new Date());
      }
    } finally {
      this.active = false;
    }
  }

  private async trackGuild(guildId: string) {
    const players = await PlayerModel.find({ guildId, active: true });
    for (const playerDocument of players) {
      const player = this.playerService.toRegisteredPlayer(playerDocument);

      try {
        const matches = await this.provider.getRecentMatches(player);
        const trackingStartedAt = playerDocument.trackingStartedAt ?? playerDocument.createdAt;
        for (const match of matches) {
          if (trackingStartedAt && getMatchFinishedAt(match) <= trackingStartedAt) {
            await this.matchService.saveIfNew(guildId, player, match);
            continue;
          }

          await this.matchService.saveAndPost(this.client, guildId, player, match);
        }
      } catch (error) {
        logger.warn("Tracking failed for player", {
          guildId,
          player: `${player.riotName}#${player.tagLine}`,
          provider: this.provider.getName(),
          error: error instanceof Error ? error.message : String(error)
        });

        if (this.provider.getName() === "henrik" && isHenrikRateLimited()) {
          logger.warn("Tracking paused until the next scheduler cycle because Henrik is rate limited", {
            guildId,
            provider: this.provider.getName()
          });
          break;
        }
      }

      await sleep(1_500);
    }
  }
}

const getMatchFinishedAt = (match: { startedAt: Date; durationSeconds?: number }) => {
  if (!match.durationSeconds) return match.startedAt;
  return new Date(match.startedAt.getTime() + match.durationSeconds * 1000);
};
