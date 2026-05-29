import { env } from "../config/env";
import { HenrikMmrService, MatchMmr } from "../services/HenrikMmrService";
import { HenrikMatchPayload, HenrikMatchesResponseSchema, HenrikPlayerPayload } from "../types/henrik.types";
import { ProviderMatch, ProviderPlayerValidation, RegisteredPlayer } from "../types/match.types";
import { logger } from "../utils/logger";
import { MatchProvider } from "./MatchProvider";

export class HenrikMatchProvider implements MatchProvider {
  private readonly mmrService = new HenrikMmrService();

  getName() {
    return "henrik";
  }

  async validatePlayer(riotName: string, tagLine: string): Promise<ProviderPlayerValidation> {
    if (!env.HENRIK_API_KEY) {
      return { valid: false, reason: "HENRIK_API_KEY is not configured" };
    }

    try {
      const matches = await this.fetchMatches(riotName, tagLine, 1);
      return {
        valid: true,
        displayName: `${riotName}#${tagLine}`,
        providerPlayerId: findPlayer(matches[0], riotName, tagLine)?.puuid ?? `${riotName}#${tagLine}`
      };
    } catch (error) {
      logger.warn("Henrik player validation failed", {
        riotName,
        tagLine,
        error: error instanceof Error ? error.message : String(error)
      });
      return { valid: false, reason: "Henrik API did not validate this Riot account" };
    }
  }

  async getRecentMatches(player: RegisteredPlayer): Promise<ProviderMatch[]> {
    const [matches, mmrByMatchId] = await Promise.all([
      this.fetchMatches(player.riotName, player.tagLine, 10),
      this.mmrService.getMatchMmrHistory(player).catch((error) => {
        logger.warn("Henrik MMR history lookup failed", {
          player: `${player.riotName}#${player.tagLine}`,
          error: error instanceof Error ? error.message : String(error)
        });
        return new Map<string, MatchMmr>();
      })
    ]);

    return matches
      .filter(isCompetitiveMatch)
      .map((match) => this.toProviderMatch(match, player, mmrByMatchId))
      .filter((match): match is ProviderMatch => Boolean(match))
      .sort((left, right) => right.startedAt.getTime() - left.startedAt.getTime());
  }

  private async fetchMatches(riotName: string, tagLine: string, size: number) {
    const encodedName = encodeURIComponent(riotName);
    const encodedTag = encodeURIComponent(tagLine);
    const path = `/valorant/v4/matches/${env.HENRIK_REGION}/${env.HENRIK_PLATFORM}/${encodedName}/${encodedTag}`;
    const url = new URL(path, env.HENRIK_API_BASE_URL);
    url.searchParams.set("size", String(size));

    const response = await fetch(url, {
      headers: {
        Authorization: env.HENRIK_API_KEY,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("Henrik API rate limit reached. Try again after the current rate-limit window.");
      }
      throw new Error(`Henrik API returned HTTP ${response.status} for ${url.pathname}`);
    }

    const parsed = HenrikMatchesResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      logger.warn("Henrik matches payload did not match expected schema", {
        player: `${riotName}#${tagLine}`,
        issues: parsed.error.issues
      });
      return [];
    }

    return parsed.data.data;
  }

  private toProviderMatch(match: HenrikMatchPayload, player: RegisteredPlayer, mmrByMatchId?: Map<string, MatchMmr>): ProviderMatch | null {
    const participant = findPlayer(match, player.riotName, player.tagLine);
    if (!participant) return null;

    const participantTeamId = participant.team_id ?? participant.team;
    const team = getTeam(match, participantTeamId);
    const enemy = participantTeamId?.toLowerCase() === "red" ? getTeam(match, "Blue") : getTeam(match, "Red");
    const score = participant.stats?.score;
    const roundsPlayed = match.metadata.rounds_played ?? inferRoundsPlayed(team, enemy);
    const roundStats = deriveRoundStats(match, participant);
    const shotStats = deriveShotStats(participant);
    const providerMatchId = match.metadata.match_id ?? match.metadata.matchid ?? `${player.guildId}-${player.discordUserId}-${readMatchStart(match).getTime()}`;
    const mmr = mmrByMatchId?.get(providerMatchId);

    return {
      provider: this.getName(),
      providerMatchId,
      startedAt: readMatchStart(match),
      map: readText(match.metadata.map, "name", "id"),
      mode: match.metadata.mode,
      queue: match.metadata.mode_id ?? readText(match.metadata.queue, "name", "id"),
      teamScore: readTeamRoundsWon(team),
      enemyScore: readTeamRoundsWon(enemy),
      durationSeconds: readMatchDurationSeconds(match),
      playerStats: {
        riotName: participant.name ?? player.riotName,
        tagLine: participant.tag ?? player.tagLine,
        agent: participant.character ?? readText(participant.agent, "name", "id"),
        kills: participant.stats?.kills,
        deaths: participant.stats?.deaths,
        assists: participant.stats?.assists,
        score,
        combatScore: score && roundsPlayed ? Math.round(score / roundsPlayed) : undefined,
        won: team?.has_won ?? team?.won,
        firstBloods: roundStats.firstBloods,
        firstDeaths: roundStats.firstDeaths,
        roundsPlayed,
        playtimeMillis: participant.session_playtime?.milliseconds ?? participant.session_playtime_in_ms,
        totalDamage: participant.damage_made ?? participant.stats?.damage?.dealt,
        headshots: shotStats.headshots,
        bodyshots: shotStats.bodyshots,
        legshots: shotStats.legshots,
        headshotPercent: shotStats.headshotPercent,
        bodyshotPercent: shotStats.bodyshotPercent,
        legshotPercent: shotStats.legshotPercent,
        plants: roundStats.plants,
        defuses: roundStats.defuses,
        avgLoadoutValue: participant.economy?.loadout_value?.average,
        totalSpent: participant.economy?.spent?.overall,
        totalRemaining: roundStats.totalRemaining,
        grenadeCasts: participant.ability_casts?.grenade ?? participant.ability_casts?.c_cast,
        ability1Casts: participant.ability_casts?.ability1 ?? participant.ability_casts?.ability_1 ?? participant.ability_casts?.q_cast,
        ability2Casts: participant.ability_casts?.ability2 ?? participant.ability_casts?.ability_2 ?? participant.ability_casts?.e_cast,
        ultimateCasts: participant.ability_casts?.ultimate ?? participant.ability_casts?.x_cast,
        multiKills: roundStats.multiKills,
        aces: roundStats.aces,
        maxKillsInRound: roundStats.maxKillsInRound,
        rank: mmr?.rank,
        rankTierId: mmr?.rankTierId,
        rr: mmr?.rr,
        rrChange: mmr?.rrChange,
        elo: mmr?.elo,
        rankChanged: mmr?.rankChanged,
        previousRank: mmr?.previousRank,
        previousRankTierId: mmr?.previousRankTierId
      },
      raw: match
    };
  }
}

const findPlayer = (match: HenrikMatchPayload | undefined, riotName: string, tagLine: string) => {
  if (!match) return undefined;
  return getPlayers(match).find(
    (item) => item.name?.toLowerCase() === riotName.toLowerCase() && item.tag?.toLowerCase() === tagLine.toLowerCase()
  );
};

const getTeam = (match: HenrikMatchPayload, team?: string) => {
  const key = team?.toLowerCase();
  if (!match.teams) return undefined;
  if (Array.isArray(match.teams)) {
    return match.teams.find((item) => readText(item, "team_id", "teamId", "team", "id")?.toLowerCase() === key);
  }
  if (key === "red") return match.teams.red;
  if (key === "blue") return match.teams.blue;
  return undefined;
};

const getPlayers = (match: HenrikMatchPayload) => (Array.isArray(match.players) ? match.players : match.players.all_players);

const isCompetitiveMatch = (match: HenrikMatchPayload) => {
  const queue = match.metadata.mode_id ?? readText(match.metadata.queue, "name", "id");
  const mode = match.metadata.mode;
  return [queue, mode].filter(Boolean).some((value) => value?.toLowerCase() === "competitive");
};

const readMatchStart = (match: HenrikMatchPayload) => {
  if (match.metadata.started_at) {
    const date = new Date(match.metadata.started_at);
    if (!Number.isNaN(date.getTime())) return date;
  }

  if (match.metadata.game_start) return new Date(match.metadata.game_start * 1000);
  return new Date();
};

const readMatchDurationSeconds = (match: HenrikMatchPayload) => {
  if (match.metadata.game_length_in_ms !== undefined) return Math.round(match.metadata.game_length_in_ms / 1000);
  if (match.metadata.game_length !== undefined) return Math.round(match.metadata.game_length / 1000);
  return undefined;
};

const inferRoundsPlayed = (team?: { rounds_won?: number; rounds_lost?: number }, enemy?: { rounds_won?: number }) => {
  const teamWon = readTeamRoundsWon(team);
  const teamLost = readTeamRoundsLost(team);
  const enemyWon = readTeamRoundsWon(enemy);
  if (teamWon !== undefined && teamLost !== undefined) return teamWon + teamLost;
  if (teamWon !== undefined && enemyWon !== undefined) return teamWon + enemyWon;
  return undefined;
};

const readTeamRoundsWon = (team?: { rounds_won?: number; rounds?: { won?: number } }) => team?.rounds_won ?? team?.rounds?.won;
const readTeamRoundsLost = (team?: { rounds_lost?: number; rounds?: { lost?: number } }) => team?.rounds_lost ?? team?.rounds?.lost;

const deriveShotStats = (player: HenrikPlayerPayload) => {
  const headshots = player.stats?.headshots ?? 0;
  const bodyshots = player.stats?.bodyshots ?? 0;
  const legshots = player.stats?.legshots ?? 0;
  const totalShots = headshots + bodyshots + legshots;

  return {
    headshots,
    bodyshots,
    legshots,
    headshotPercent: totalShots ? Math.round((headshots / totalShots) * 100) : 0,
    bodyshotPercent: totalShots ? Math.round((bodyshots / totalShots) * 100) : 0,
    legshotPercent: totalShots ? Math.round((legshots / totalShots) * 100) : 0
  };
};

const deriveRoundStats = (match: HenrikMatchPayload, player: HenrikPlayerPayload) => {
  let firstBloods = 0;
  let firstDeaths = 0;
  let plants = 0;
  let defuses = 0;
  let multiKills = 0;
  let aces = 0;
  let maxKillsInRound = 0;
  let totalRemaining = 0;

  const killsByRound = new Map<number, Record<string, unknown>[]>();
  for (const kill of readArray(match, "kills")) {
    const roundNumber = readNumber(kill, "round");
    if (!killsByRound.has(roundNumber)) killsByRound.set(roundNumber, []);
    killsByRound.get(roundNumber)?.push(kill);
  }

  for (const round of match.rounds) {
    if (readPuuid(getRecord(round, "plant"), "player") === player.puuid || readPuuid(getRecord(round, "plant_events"), "planted_by") === player.puuid) {
      plants += 1;
    }
    if (readPuuid(getRecord(round, "defuse"), "player") === player.puuid || readPuuid(getRecord(round, "defuse_events"), "defused_by") === player.puuid) {
      defuses += 1;
    }

    const roundNumber = readNumber(round, "id") || readNumber(round, "round");
    const kills = (killsByRound.get(roundNumber) ?? readArray(round, "kills")).sort(
      (left, right) =>
        (readNumber(left, "time_in_round_in_ms") || readNumber(left, "time_since_round_start_millis")) -
        (readNumber(right, "time_in_round_in_ms") || readNumber(right, "time_since_round_start_millis"))
    );
    const firstKill = kills[0];
    if (readPuuid(firstKill, "killer") === player.puuid || readText(firstKill, "killer_puuid") === player.puuid) firstBloods += 1;
    if (readPuuid(firstKill, "victim") === player.puuid || readText(firstKill, "victim_puuid") === player.puuid) firstDeaths += 1;

    const playerRoundKills = kills.filter((kill) => readPuuid(kill, "killer") === player.puuid || readText(kill, "killer_puuid") === player.puuid).length;
    maxKillsInRound = Math.max(maxKillsInRound, playerRoundKills);
    if (playerRoundKills >= 2) multiKills += 1;
    if (playerRoundKills >= 5) aces += 1;

    totalRemaining += readNumber(findRoundPlayerStats(round, player.puuid), "economy", "remaining");
  }

  return {
    firstBloods,
    firstDeaths,
    plants,
    defuses,
    totalRemaining,
    multiKills,
    aces,
    maxKillsInRound
  };
};

const getRecord = (value: unknown, ...path: string[]): Record<string, unknown> | undefined => {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current && typeof current === "object" ? (current as Record<string, unknown>) : undefined;
};

const readArray = (value: unknown, key: string) => {
  const candidate = getRecord(value)?.[key];
  return Array.isArray(candidate) ? candidate.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object")) : [];
};

const readNumber = (value: unknown, ...path: string[]) => {
  const candidate = path.length ? getRecord(value, ...path.slice(0, -1))?.[path[path.length - 1]] : value;
  return typeof candidate === "number" ? candidate : 0;
};

const readPuuid = (value: unknown, key: string) => {
  const candidate = getRecord(value)?.[key];
  if (typeof candidate === "string") return candidate;
  if (candidate && typeof candidate === "object") {
    const puuid = (candidate as Record<string, unknown>).puuid;
    return typeof puuid === "string" ? puuid : undefined;
  }
  return undefined;
};

const readText = (value: unknown, ...keys: string[]) => {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return undefined;
  for (const key of keys) {
    const candidate = (value as Record<string, unknown>)[key];
    if (typeof candidate === "string") return candidate;
  }
  return undefined;
};

const findRoundPlayerStats = (round: unknown, puuid?: string) => {
  if (!puuid) return undefined;
  return [...readArray(round, "player_stats"), ...readArray(round, "stats")].find(
    (item) => readPuuid(item, "player") === puuid || item.puuid === puuid || item.player_puuid === puuid
  );
};
