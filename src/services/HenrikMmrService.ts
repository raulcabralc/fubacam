import { env } from "../config/env";
import { getHenrikRateLimitMessage, isHenrikRateLimited } from "../providers/henrik-rate-limit";
import { HenrikMmrHistoryResponseSchema, HenrikMmrResponseSchema } from "../types/henrik.types";
import { logger } from "../utils/logger";

export type PlayerMmr = {
  riotName: string;
  tagLine: string;
  discordUserId: string;
  tierId: number;
  rank: string;
  rr: number;
  elo: number;
  lastChange?: number;
  leaderboardRank?: number;
};

export type MatchMmr = {
  matchId: string;
  rank?: string;
  rankTierId?: number;
  rr?: number;
  rrChange?: number;
  elo?: number;
  rankChanged?: boolean;
  previousRank?: string;
  previousRankTierId?: number;
};

const MMR_HISTORY_CACHE_MS = 5 * 60 * 1000;
const MMR_HISTORY_FAILURE_CACHE_MS = 60 * 1000;
const mmrHistoryCache = new Map<string, { expiresAt: number; data: Map<string, MatchMmr> }>();

export class HenrikMmrService {
  async getPlayerMmr(player: { riotName: string; tagLine: string; discordUserId: string }): Promise<PlayerMmr | null> {
    if (!env.HENRIK_API_KEY) {
      throw new Error("HENRIK_API_KEY is not configured");
    }
    if (isHenrikRateLimited()) {
      logger.warn("Skipping Henrik MMR request during rate-limit cooldown", {
        player: `${player.riotName}#${player.tagLine}`,
        error: getHenrikRateLimitMessage()
      });
      return null;
    }

    const encodedName = encodeURIComponent(player.riotName);
    const encodedTag = encodeURIComponent(player.tagLine);
    const path = `/valorant/v3/mmr/${env.HENRIK_REGION}/${env.HENRIK_PLATFORM}/${encodedName}/${encodedTag}`;
    const url = new URL(path, env.HENRIK_API_BASE_URL);

    const response = await fetch(url, {
      headers: {
        Authorization: env.HENRIK_API_KEY,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      logger.warn("Henrik MMR request failed", {
        player: `${player.riotName}#${player.tagLine}`,
        status: response.status
      });
      return null;
    }

    const parsed = HenrikMmrResponseSchema.safeParse(await response.json());
    if (!parsed.success || !parsed.data.data?.current) {
      logger.warn("Henrik MMR payload did not match expected schema", {
        player: `${player.riotName}#${player.tagLine}`,
        issues: parsed.success ? [] : parsed.error.issues
      });
      return null;
    }

    const current = parsed.data.data.current;
    return {
      riotName: parsed.data.data.account?.name ?? player.riotName,
      tagLine: parsed.data.data.account?.tag ?? player.tagLine,
      discordUserId: player.discordUserId,
      tierId: current.tier?.id ?? 0,
      rank: current.tier?.name ?? "Unrated",
      rr: current.rr ?? 0,
      elo: current.elo ?? 0,
      lastChange: current.last_change,
      leaderboardRank: current.leaderboard_placement?.rank
    };
  }

  async getGuildLeaderboard(players: Array<{ riotName: string; tagLine: string; discordUserId: string }>) {
    const rows = await Promise.all(players.map((player) => this.getPlayerMmr(player)));
    return rows
      .filter((row): row is PlayerMmr => Boolean(row))
      .sort((left, right) => right.elo - left.elo || right.tierId - left.tierId || right.rr - left.rr);
  }

  async getMatchMmrHistory(player: { riotName: string; tagLine: string }): Promise<Map<string, MatchMmr>> {
    if (!env.HENRIK_API_KEY) {
      throw new Error("HENRIK_API_KEY is not configured");
    }

    const cacheKey = `${player.riotName.toLowerCase()}#${player.tagLine.toLowerCase()}`;
    const cached = mmrHistoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    if (isHenrikRateLimited()) {
      return new Map();
    }

    const encodedName = encodeURIComponent(player.riotName);
    const encodedTag = encodeURIComponent(player.tagLine);
    const path = `/valorant/v2/mmr-history/${env.HENRIK_REGION}/${env.HENRIK_PLATFORM}/${encodedName}/${encodedTag}`;
    const url = new URL(path, env.HENRIK_API_BASE_URL);

    const response = await fetch(url, {
      headers: {
        Authorization: env.HENRIK_API_KEY,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      logger.warn("Henrik MMR history request failed", {
        player: `${player.riotName}#${player.tagLine}`,
        status: response.status
      });
      mmrHistoryCache.set(cacheKey, { expiresAt: Date.now() + MMR_HISTORY_FAILURE_CACHE_MS, data: new Map() });
      return new Map();
    }

    const parsed = HenrikMmrHistoryResponseSchema.safeParse(await response.json());
    if (!parsed.success || !parsed.data.data?.history) {
      logger.warn("Henrik MMR history payload did not match expected schema", {
        player: `${player.riotName}#${player.tagLine}`,
        issues: parsed.success ? [] : parsed.error.issues
      });
      mmrHistoryCache.set(cacheKey, { expiresAt: Date.now() + MMR_HISTORY_FAILURE_CACHE_MS, data: new Map() });
      return new Map();
    }

    const rows = parsed.data.data.history;
    const mapped = new Map(
      rows
        .filter((row) => row.match_id)
        .map((row, index) => {
          const previous = rows[index + 1];
          const rankTierId = row.tier?.id;
          const previousRankTierId = previous?.tier?.id;
          return [
            row.match_id as string,
            {
              matchId: row.match_id as string,
              rank: row.tier?.name,
              rankTierId,
              rr: row.rr,
              rrChange: row.last_change,
              elo: row.elo,
              rankChanged: previousRankTierId !== undefined && rankTierId !== undefined && previousRankTierId !== rankTierId,
              previousRank: previous?.tier?.name,
              previousRankTierId
            }
          ];
        })
    );
    mmrHistoryCache.set(cacheKey, { expiresAt: Date.now() + MMR_HISTORY_CACHE_MS, data: mapped });
    return mapped;
  }
}
