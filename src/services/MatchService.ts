import { Client } from "discord.js";
import { MatchModel } from "../database/models/Match.model";
import { GuildSettingsModel } from "../database/models/GuildSettings.model";
import { buildMatchSummaryEmbed } from "../discord/embeds/match-summary.embed";
import { ProviderMatch, RegisteredPlayer } from "../types/match.types";
import { logger } from "../utils/logger";

export class MatchService {
  async saveIfNew(guildId: string, player: RegisteredPlayer, match: ProviderMatch) {
    const created = await MatchModel.findOneAndUpdate(
      { guildId, provider: match.provider, providerMatchId: match.providerMatchId },
      {
        $setOnInsert: {
          guildId,
          provider: match.provider,
          providerMatchId: match.providerMatchId,
          playerDiscordUserId: player.discordUserId,
          riotName: match.playerStats.riotName,
          tagLine: match.playerStats.tagLine,
          startedAt: match.startedAt,
          map: match.map,
          mode: match.mode,
          queue: match.queue,
          teamScore: match.teamScore,
          enemyScore: match.enemyScore,
          durationSeconds: match.durationSeconds,
          agent: match.playerStats.agent,
          kills: match.playerStats.kills,
          deaths: match.playerStats.deaths,
          assists: match.playerStats.assists,
          score: match.playerStats.score,
          combatScore: match.playerStats.combatScore,
          won: match.playerStats.won,
          raw: match.raw
        }
      },
      { upsert: true, new: true, includeResultMetadata: true }
    );

    return {
      match: created.value,
      isNew: !created.lastErrorObject?.updatedExisting
    };
  }

  async postMatchSummary(client: Client, guildId: string, matchId: string) {
    const settings = await GuildSettingsModel.findOne({ guildId });
    if (!settings?.summaryChannelId) return false;

    const match = await MatchModel.findById(matchId);
    if (!match || match.postedAt) return false;

    const channel = await client.channels.fetch(settings.summaryChannelId);
    if (!channel?.isTextBased() || !("send" in channel)) return false;

    await channel.send({ embeds: [buildMatchSummaryEmbed(match)] });
    match.postedAt = new Date();
    await match.save();
    return true;
  }

  async saveAndPost(client: Client, guildId: string, player: RegisteredPlayer, match: ProviderMatch) {
    const result = await this.saveIfNew(guildId, player, match);
    if (result.isNew && result.match?._id) {
      try {
        await this.postMatchSummary(client, guildId, String(result.match._id));
      } catch (error) {
        logger.warn("Could not post match summary", {
          guildId,
          matchId: match.providerMatchId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    return result;
  }

  async lastMatch(guildId: string, discordUserId: string) {
    return MatchModel.findOne({ guildId, playerDiscordUserId: discordUserId }).sort({ startedAt: -1 });
  }
}
