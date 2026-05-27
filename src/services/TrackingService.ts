import { Client } from "discord.js";
import { GuildSettingsModel } from "../database/models/GuildSettings.model";
import { PlayerModel } from "../database/models/Player.model";
import { MatchProvider } from "../providers/MatchProvider";
import { GuildSettingsService } from "./GuildSettingsService";
import { MatchService } from "./MatchService";
import { PlayerService } from "./PlayerService";
import { logger } from "../utils/logger";

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
      const settings = await GuildSettingsModel.find({ trackingEnabled: true });

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
        for (const match of matches) {
          await this.matchService.saveAndPost(this.client, guildId, player, match);
        }
      } catch (error) {
        logger.warn("Tracking failed for player", {
          guildId,
          player: `${player.riotName}#${player.tagLine}`,
          provider: this.provider.getName(),
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }
}
