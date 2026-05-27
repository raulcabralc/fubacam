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
    const roundStats = deriveRoundStats(match, participant.puuid);
    const abilityCasts = participant.stats?.abilityCasts;

    return {
      provider: this.getName(),
      providerMatchId: match.matchInfo.matchId,
      startedAt: new Date(match.matchInfo.gameStartMillis ?? Date.now()),
      map: normalizeRiotAssetId(match.matchInfo.mapId),
      mode: normalizeRiotAssetId(match.matchInfo.gameMode),
      queue: match.matchInfo.queueId,
      teamScore: team?.roundsWon,
      enemyScore: enemy?.roundsWon,
      durationSeconds: match.matchInfo.gameLengthMillis ? Math.round(match.matchInfo.gameLengthMillis / 1000) : undefined,
      playerStats: {
        riotName: participant.gameName ?? player.riotName,
        tagLine: participant.tagLine ?? player.tagLine,
        agent: normalizeRiotAssetId(participant.characterId),
        kills: participant.stats?.kills,
        deaths: participant.stats?.deaths,
        assists: participant.stats?.assists,
        score: participant.stats?.score,
        combatScore:
          participant.stats?.score && participant.stats.roundsPlayed
            ? Math.round(participant.stats.score / participant.stats.roundsPlayed)
            : undefined,
        won: team?.won,
        roundsPlayed: participant.stats?.roundsPlayed ?? team?.roundsPlayed,
        playtimeMillis: participant.stats?.playtimeMillis,
        firstBloods: roundStats.firstBloods,
        firstDeaths: roundStats.firstDeaths,
        totalDamage: roundStats.totalDamage,
        headshots: roundStats.headshots,
        bodyshots: roundStats.bodyshots,
        legshots: roundStats.legshots,
        headshotPercent: roundStats.headshotPercent,
        bodyshotPercent: roundStats.bodyshotPercent,
        legshotPercent: roundStats.legshotPercent,
        plants: roundStats.plants,
        defuses: roundStats.defuses,
        avgLoadoutValue: roundStats.avgLoadoutValue,
        totalSpent: roundStats.totalSpent,
        totalRemaining: roundStats.totalRemaining,
        grenadeCasts: abilityCasts?.grenadeCasts,
        ability1Casts: abilityCasts?.ability1Casts,
        ability2Casts: abilityCasts?.ability2Casts,
        ultimateCasts: abilityCasts?.ultimateCasts,
        multiKills: roundStats.multiKills,
        aces: roundStats.aces,
        maxKillsInRound: roundStats.maxKillsInRound
      },
      raw: match
    };
  }
}

const deriveRoundStats = (match: RiotMatchPayload, puuid: string) => {
  let firstBloods = 0;
  let firstDeaths = 0;
  let totalDamage = 0;
  let headshots = 0;
  let bodyshots = 0;
  let legshots = 0;
  let plants = 0;
  let defuses = 0;
  let totalLoadoutValue = 0;
  let economyRounds = 0;
  let totalSpent = 0;
  let totalRemaining = 0;
  let multiKills = 0;
  let aces = 0;
  let maxKillsInRound = 0;

  for (const round of match.roundResults) {
    if (round.bombPlanter === puuid) plants += 1;
    if (round.bombDefuser === puuid) defuses += 1;

    const firstKill = round.playerStats
      .flatMap((roundPlayer) => roundPlayer.kills)
      .sort((left, right) => left.timeSinceRoundStartMillis - right.timeSinceRoundStartMillis)[0];

    if (firstKill?.killer === puuid) firstBloods += 1;
    if (firstKill?.victim === puuid) firstDeaths += 1;

    const playerRound = round.playerStats.find((item) => item.puuid === puuid);
    if (!playerRound) continue;

    const roundKills = playerRound.kills.length;
    maxKillsInRound = Math.max(maxKillsInRound, roundKills);
    if (roundKills >= 2) multiKills += 1;
    if (roundKills >= 5) aces += 1;

    totalLoadoutValue += playerRound.economy.loadoutValue;
    totalSpent += playerRound.economy.spent;
    totalRemaining += playerRound.economy.remaining;
    economyRounds += 1;

    for (const damage of playerRound.damage) {
      totalDamage += damage.damage;
      headshots += damage.headshots;
      bodyshots += damage.bodyshots;
      legshots += damage.legshots;
    }
  }

  const totalShots = headshots + bodyshots + legshots;

  return {
    firstBloods,
    firstDeaths,
    totalDamage,
    headshots,
    bodyshots,
    legshots,
    headshotPercent: totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0,
    bodyshotPercent: totalShots > 0 ? Math.round((bodyshots / totalShots) * 100) : 0,
    legshotPercent: totalShots > 0 ? Math.round((legshots / totalShots) * 100) : 0,
    plants,
    defuses,
    avgLoadoutValue: economyRounds > 0 ? Math.round(totalLoadoutValue / economyRounds) : 0,
    totalSpent,
    totalRemaining,
    multiKills,
    aces,
    maxKillsInRound
  };
};

const normalizeRiotAssetId = (value?: string) => {
  if (!value) return undefined;
  const parts = value.split("/");
  return parts[parts.length - 1] || value;
};
