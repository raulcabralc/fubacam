import { Client } from "discord.js";
import { MatchModel } from "../database/models/Match.model";
import { GuildSettingsModel } from "../database/models/GuildSettings.model";
import { buildCompactMatchSummaryEmbed } from "../discord/embeds/match-compact.embed";
import { ProviderMatch, RegisteredPlayer } from "../types/match.types";
import { logger } from "../utils/logger";
import { getPostMatchNotifications } from "./post-match-notifications";

const competitiveMatchFilter = {
  $or: [{ queue: /^competitive$/i }, { mode: /^competitive$/i }]
};

export class MatchService {
  async saveIfNew(guildId: string, player: RegisteredPlayer, match: ProviderMatch) {
    const matchData = {
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
      firstBloods: match.playerStats.firstBloods,
      firstDeaths: match.playerStats.firstDeaths,
      roundsPlayed: match.playerStats.roundsPlayed,
      playtimeMillis: match.playerStats.playtimeMillis,
      totalDamage: match.playerStats.totalDamage,
      headshots: match.playerStats.headshots,
      bodyshots: match.playerStats.bodyshots,
      legshots: match.playerStats.legshots,
      headshotPercent: match.playerStats.headshotPercent,
      bodyshotPercent: match.playerStats.bodyshotPercent,
      legshotPercent: match.playerStats.legshotPercent,
      plants: match.playerStats.plants,
      defuses: match.playerStats.defuses,
      avgLoadoutValue: match.playerStats.avgLoadoutValue,
      totalSpent: match.playerStats.totalSpent,
      totalRemaining: match.playerStats.totalRemaining,
      grenadeCasts: match.playerStats.grenadeCasts,
      ability1Casts: match.playerStats.ability1Casts,
      ability2Casts: match.playerStats.ability2Casts,
      ultimateCasts: match.playerStats.ultimateCasts,
      multiKills: match.playerStats.multiKills,
      aces: match.playerStats.aces,
      maxKillsInRound: match.playerStats.maxKillsInRound,
      rank: match.playerStats.rank,
      rankTierId: match.playerStats.rankTierId,
      rr: match.playerStats.rr,
      rrChange: match.playerStats.rrChange,
      elo: match.playerStats.elo,
      rankChanged: match.playerStats.rankChanged,
      previousRank: match.playerStats.previousRank,
      previousRankTierId: match.playerStats.previousRankTierId,
      raw: match.raw
    };

    const created = await MatchModel.findOneAndUpdate(
      { guildId, provider: match.provider, providerMatchId: match.providerMatchId, playerDiscordUserId: player.discordUserId },
      {
        $set: matchData
      },
      { upsert: true, new: true, includeResultMetadata: true }
    );

    return {
      match: created.value,
      isNew: !created.lastErrorObject?.updatedExisting
    };
  }

  async postMatchSummary(
    client: Client,
    guildId: string,
    matchId: string,
    options?: {
      force?: boolean;
      markPosted?: boolean;
      simulateFinishedNow?: boolean;
    },
  ) {
    const settings = await GuildSettingsModel.findOne({ guildId });
    if (!settings?.summaryChannelId) return false;

    const match = await MatchModel.findById(matchId);
    if (!match || (match.postedAt && !options?.force)) return false;

    const channel = await client.channels.fetch(settings.summaryChannelId).catch((error) => {
      logger.warn("Cannot access configured summary channel", {
        guildId,
        channelId: settings.summaryChannelId,
        error: error instanceof Error ? error.message : String(error)
      });
      return undefined;
    });
    if (!channel?.isTextBased() || !("send" in channel)) return false;

    const matchUser = await client.users.fetch(match.playerDiscordUserId).catch(() => undefined);
    await channel.send({
      embeds: [
        buildCompactMatchSummaryEmbed(match, {
          matchUser,
          timestamp: options?.simulateFinishedNow ? new Date() : undefined
        })
      ]
    });
    for (const notification of getPostMatchNotifications(match)) {
      await channel.send(notification).catch((error) => {
        logger.warn("Could not post match notification", {
          guildId,
          matchId: match.providerMatchId,
          error: error instanceof Error ? error.message : String(error)
        });
      });
    }
    if (options?.markPosted ?? true) {
      match.postedAt = new Date();
      await match.save();
    }
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
    return MatchModel.findOne({ guildId, playerDiscordUserId: discordUserId, ...competitiveMatchFilter }).sort({ startedAt: -1 });
  }

  async matchByIndex(guildId: string, discordUserId: string, index: number) {
    return MatchModel.findOne({ guildId, playerDiscordUserId: discordUserId, ...competitiveMatchFilter })
      .sort({ startedAt: -1 })
      .skip(Math.max(index - 1, 0));
  }

  async recentMatches(guildId: string, discordUserId: string, limit = 20) {
    return MatchModel.find({ guildId, playerDiscordUserId: discordUserId, ...competitiveMatchFilter }).sort({ startedAt: -1 }).limit(limit);
  }

  async lastValidProviderMatch(guildId: string, discordUserId: string, provider: string) {
    return MatchModel.findOne({
      guildId,
      playerDiscordUserId: discordUserId,
      provider,
      ...competitiveMatchFilter,
      providerMatchId: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    }).sort({ startedAt: -1 });
  }

  async findProviderMatch(guildId: string, discordUserId: string, provider: string, providerMatchId: string) {
    return MatchModel.findOne({ guildId, playerDiscordUserId: discordUserId, provider, providerMatchId, ...competitiveMatchFilter });
  }

  async deleteMalformedProviderMatches(guildId: string, discordUserId: string, provider: string) {
    return MatchModel.deleteMany({
      guildId,
      playerDiscordUserId: discordUserId,
      provider,
      providerMatchId: { $not: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i }
    });
  }
}
