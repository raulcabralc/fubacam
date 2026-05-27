import { env } from "../config/env";
import { MatchProvider } from "./MatchProvider";
import { ProviderMatch, ProviderPlayerValidation, RegisteredPlayer } from "../types/match.types";
import { RiotMatchListSchema, RiotMatchPayload, RiotMatchSchema } from "../types/riot.types";
import { logger } from "../utils/logger";

export class RiotMatchProvider implements MatchProvider {
  getName() {
    return "riot";
  }

  async validatePlayer(riotName: string, tagLine: string): Promise<ProviderPlayerValidation> {
    return {
      valid: false,
      reason: `Use /link-riot to authorize ${riotName}#${tagLine} with Riot Sign On.`
    };
  }

  async getRecentMatches(player: RegisteredPlayer): Promise<ProviderMatch[]> {
    if (!player.riotPuuid) {
      throw new Error(`Player ${player.riotName}#${player.tagLine} has not linked Riot Sign On yet.`);
    }

    const matchList = await this.requestJson(`/val/match/v1/matchlists/by-puuid/${player.riotPuuid}`);
    const parsedList = RiotMatchListSchema.safeParse(matchList);
    if (!parsedList.success) {
      logger.warn("Riot matchlist payload did not match expected schema", {
        player: `${player.riotName}#${player.tagLine}`,
        issues: parsedList.error.issues
      });
      return [];
    }

    const recent = parsedList.data.history.slice(0, 5);
    const matches: ProviderMatch[] = [];

    for (const item of recent) {
      const detail = await this.requestJson(`/val/match/v1/matches/${item.matchId}`);
      const parsedMatch = RiotMatchSchema.safeParse(detail);
      if (!parsedMatch.success) {
        logger.warn("Riot match payload did not match expected schema", {
          matchId: item.matchId,
          issues: parsedMatch.error.issues
        });
        continue;
      }

      const mapped = this.toProviderMatch(parsedMatch.data, player);
      if (mapped) matches.push(mapped);
    }

    return matches;
  }

  private async requestJson(path: string): Promise<unknown> {
    if (!env.RIOT_API_KEY) {
      throw new Error("RIOT_API_KEY is not configured");
    }

    const url = new URL(path, `https://${env.RIOT_API_REGION}.api.riotgames.com`);
    const response = await fetch(url, {
      headers: {
        "X-Riot-Token": env.RIOT_API_KEY,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Riot API returned HTTP ${response.status}. Valorant match data requires an approved Production API key with VAL-MATCH-V1 access.`
        );
      }

      throw new Error(`Riot API returned HTTP ${response.status} for ${url.pathname}`);
    }

    return response.json();
  }

  private toProviderMatch(match: RiotMatchPayload, player: RegisteredPlayer): ProviderMatch | null {
    const participant = match.players.find((item) => item.puuid === player.riotPuuid);
    if (!participant) return null;

    const team = match.teams?.find((item) => item.teamId === participant.teamId);
    const enemy = match.teams?.find((item) => item.teamId !== participant.teamId);

    return {
      provider: this.getName(),
      providerMatchId: match.metadata.matchId,
      startedAt: new Date(match.metadata.gameStartMillis ?? Date.now()),
      map: normalizeRiotAssetId(match.metadata.mapId),
      mode: normalizeRiotAssetId(match.metadata.gameMode),
      queue: match.metadata.gameMode,
      teamScore: team?.roundsWon,
      enemyScore: enemy?.roundsWon,
      durationSeconds: match.metadata.gameLengthMillis ? Math.round(match.metadata.gameLengthMillis / 1000) : undefined,
      playerStats: {
        riotName: participant.gameName ?? player.riotName,
        tagLine: participant.tagLine ?? player.tagLine,
        agent: normalizeRiotAssetId(participant.characterId),
        kills: participant.stats?.kills,
        deaths: participant.stats?.deaths,
        assists: participant.stats?.assists,
        score: participant.stats?.score,
        won: team?.won
      },
      raw: match
    };
  }
}

const normalizeRiotAssetId = (value?: string) => {
  if (!value) return undefined;
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
};
