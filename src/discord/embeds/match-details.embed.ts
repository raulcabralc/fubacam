import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";
import {
  fubaEmojis,
  getAgentEmoji,
  getRankEmoji,
  getRankEmojiByName,
} from "../emojis";
import {
  formatInlineFblScore,
  getFblScoreFromStats,
} from "./fbl-score.helpers";
import { resolveValorantAgentAsset } from "../../utils/valorant-assets";

type DetailPlayer = {
  riotId: string;
  team: string;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  acs: number;
  headshotPercent: number;
  firstBloods: number;
  firstDeaths: number;
  roundsPlayed: number;
  mvpType?: "match" | "team";
  rank?: string;
  tier?: number;
  won?: boolean;
};

export const buildMatchDetailsEmbed = (
  match: MatchDocument,
  _requestedBy?: User,
) => {
  const targetRiotId = `${match.riotName}#${match.tagLine}`.toLowerCase();
  const players = extractPlayers(match);
  const target = players.find(
    (player) => player.riotId.toLowerCase() === targetRiotId,
  );
  const teams = groupTeams(players, target?.team);
  const matchMvpAcs = Math.max(...players.map((player) => player.acs));
  const playerAgent = resolveValorantAgentAsset(target?.agent ?? match.agent);
  const result = match.won ? "won" : "lost";
  const mode = match.mode ?? match.queue ?? "Competitive";
  const score = formatScore(match);
  const timeline = buildTimeline(match, target?.team);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${match.riotName}#${match.tagLine} ${result} a ${mode} game`,
      iconURL: playerAgent?.imageUrl,
    })
    .setTitle(`${match.map ?? "Unknown Map"} - ${score}`)
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .addFields(
      {
        name: "Your Team",
        value: formatTeam(teams.yourTeam, matchMvpAcs),
        inline: false,
      },
      {
        name: "Timeline",
        value: timeline || "No round timeline available.",
        inline: false,
      },
      {
        name: "Enemy Team",
        value: formatTeam(teams.enemyTeam, matchMvpAcs),
        inline: false,
      },
    )
    .setTimestamp(match.startedAt);

  return embed;
};

const extractPlayers = (match: MatchDocument): DetailPlayer[] => {
  const raw = getRecord(match.raw);
  const rawPlayers = Array.isArray(raw?.players)
    ? raw.players
    : raw?.players &&
        typeof raw.players === "object" &&
        Array.isArray((raw.players as { all_players?: unknown[] }).all_players)
      ? (raw.players as { all_players: unknown[] }).all_players
      : [];

  const rounds =
    readNumber(getRecord(raw?.metadata)?.rounds_played) ||
    inferRoundsFromTeams(match) ||
    1;
  const openingStatsByPuuid = extractOpeningStatsByPuuid(raw);

  return rawPlayers
    .filter((player): player is Record<string, unknown> =>
      Boolean(player && typeof player === "object"),
    )
    .map((player) => {
      const stats = getRecord(player.stats);
      const name =
        readString(player.name) ?? readString(player.gameName) ?? "Unknown";
      const tag = readString(player.tag) ?? readString(player.tagLine) ?? "";
      const score = readNumber(stats?.score);
      const headshots = readNumber(stats?.headshots);
      const bodyshots = readNumber(stats?.bodyshots);
      const legshots = readNumber(stats?.legshots);
      const totalShots = headshots + bodyshots + legshots;
      const team =
        readString(player.team_id) ??
        readString(player.teamId) ??
        readString(player.team) ??
        "Unknown";

      const riotId = tag ? `${name}#${tag}` : name;
      const puuid = readString(player.puuid);
      const isTarget =
        riotId.toLowerCase() ===
        `${match.riotName}#${match.tagLine}`.toLowerCase();
      const openingStats = puuid ? openingStatsByPuuid.get(puuid) : undefined;
      const rank =
        readPlayerRank(player) ?? (isTarget ? match.rank : undefined);
      const tier = rank ? undefined : readPlayerTier(player);

      return {
        riotId,
        team,
        agent:
          readString(getRecord(player.agent)?.name) ??
          readString(player.character) ??
          readString(player.characterId) ??
          "Unknown",
        kills: readNumber(stats?.kills),
        deaths: readNumber(stats?.deaths),
        assists: readNumber(stats?.assists),
        score,
        acs: isTarget ? (match.combatScore ?? Math.round(score / rounds)) : Math.round(score / rounds),
        headshotPercent:
          isTarget ? (match.headshotPercent ?? (totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0)) : totalShots > 0 ? Math.round((headshots / totalShots) * 100) : 0,
        firstBloods: isTarget ? (match.firstBloods ?? openingStats?.firstBloods ?? 0) : (openingStats?.firstBloods ?? 0),
        firstDeaths: isTarget ? (match.firstDeaths ?? openingStats?.firstDeaths ?? 0) : (openingStats?.firstDeaths ?? 0),
        roundsPlayed: isTarget ? (match.roundsPlayed ?? rounds) : rounds,
        rank,
        tier,
        won: readTeamWon(match, team),
      };
    });
};

const groupTeams = (players: DetailPlayer[], targetTeam?: string) => {
  const teamKeys = [...new Set(players.map((player) => player.team))];
  const yourTeamKey = targetTeam ?? teamKeys[0];
  const enemyTeamKey = teamKeys.find((team) => team !== yourTeamKey);

  return {
    yourTeam: players
      .filter((player) => player.team === yourTeamKey)
      .sort(sortPlayers),
    enemyTeam: players
      .filter((player) => player.team === enemyTeamKey)
      .sort(sortPlayers),
  };
};

const formatTeam = (players: DetailPlayer[], matchMvpAcs: number) => {
  if (!players.length) return "No player data available.";
  const teamMvpAcs = Math.max(...players.map((player) => player.acs));

  return players
    .map((player) => {
      const emoji = player.rank
        ? getRankEmojiByName(player.rank)
        : getRankEmoji(player.tier);
      const mvpEmoji =
        player.acs === matchMvpAcs
          ? `${fubaEmojis.matchMvp} `
          : player.acs === teamMvpAcs
            ? `${fubaEmojis.teamMvp} `
            : "";
      const mvpType =
        player.acs === matchMvpAcs
          ? "match"
          : player.acs === teamMvpAcs
            ? "team"
            : undefined;
      const fblScore = getFblScoreFromStats({
        kills: player.kills,
        deaths: player.deaths,
        assists: player.assists,
        acs: player.acs,
        won: player.won,
        headshotPercent: player.headshotPercent,
        firstBloods: player.firstBloods,
        firstDeaths: player.firstDeaths,
        roundsPlayed: player.roundsPlayed,
        mvpType,
      });

      return `${mvpEmoji}**${player.riotId} - ${getAgentEmoji(player.agent)} ${player.agent}**\n${emoji} ${player.acs} - ${player.kills}/${player.deaths}/${player.assists} • ${formatInlineFblScore(fblScore)}`;
    })
    .join("\n\n")
    .slice(0, 1024);
};

const buildTimeline = (match: MatchDocument, targetTeam?: string) => {
  const raw = getRecord(match.raw);
  const rounds = Array.isArray(raw?.rounds) ? raw.rounds : [];
  if (!rounds.length || !targetTeam) return "";

  return rounds
    .map((round) => {
      const record = getRecord(round);
      const winner =
        readString(record?.winning_team) ??
        readString(record?.winningTeam) ??
        readString(record?.winner) ??
        readString(record?.team) ??
        readString(getRecord(record?.result)?.winning_team);

      if (!winner) return fubaEmojis.roundUnknown;
      return winner.toLowerCase() === targetTeam.toLowerCase()
        ? fubaEmojis.roundWin
        : fubaEmojis.roundLoss;
    })
    .join("");
};

const extractOpeningStatsByPuuid = (raw?: Record<string, unknown>) => {
  const stats = new Map<string, { firstBloods: number; firstDeaths: number }>();
  const add = (puuid: string | undefined, key: "firstBloods" | "firstDeaths") => {
    if (!puuid) return;
    const current = stats.get(puuid) ?? { firstBloods: 0, firstDeaths: 0 };
    current[key] += 1;
    stats.set(puuid, current);
  };

  const riotRounds = Array.isArray(raw?.roundResults) ? raw.roundResults : [];
  for (const round of riotRounds) {
    const record = getRecord(round);
    const playerStats = Array.isArray(record?.playerStats)
      ? record.playerStats
      : [];
    const firstKill = playerStats
      .flatMap((roundPlayer) => {
        const roundPlayerRecord = getRecord(roundPlayer);
        return Array.isArray(roundPlayerRecord?.kills)
          ? roundPlayerRecord.kills
          : [];
      })
      .filter((kill): kill is Record<string, unknown> =>
        Boolean(kill && typeof kill === "object"),
      )
      .sort(
        (left, right) =>
          readNumber(left.timeSinceRoundStartMillis) -
          readNumber(right.timeSinceRoundStartMillis),
      )[0];

    add(readString(firstKill?.killer), "firstBloods");
    add(readString(firstKill?.victim), "firstDeaths");
  }

  const henrikRounds = Array.isArray(raw?.rounds) ? raw.rounds : [];
  const topLevelKills = readArray(raw, "kills");
  const killsByRound = new Map<number, Record<string, unknown>[]>();
  for (const kill of topLevelKills) {
    const roundNumber = readNumber(kill.round);
    if (!killsByRound.has(roundNumber)) killsByRound.set(roundNumber, []);
    killsByRound.get(roundNumber)?.push(kill);
  }

  for (const round of henrikRounds) {
    const record = getRecord(round);
    const roundNumber = readNumber(record?.id) || readNumber(record?.round);
    const kills = (killsByRound.get(roundNumber) ?? readArray(record, "kills"))
      .sort(
        (left, right) =>
          readNumber(left.time_in_round_in_ms) -
            readNumber(right.time_in_round_in_ms) ||
          readNumber(left.time_since_round_start_millis) -
            readNumber(right.time_since_round_start_millis),
      );
    const firstKill = kills[0];

    add(readKillPlayerPuuid(firstKill, "killer", "killer_puuid"), "firstBloods");
    add(readKillPlayerPuuid(firstKill, "victim", "victim_puuid"), "firstDeaths");
  }

  return stats;
};

const readTeamWon = (match: MatchDocument, team?: string) => {
  const raw = getRecord(match.raw);
  const rawTeams = Array.isArray(raw?.teams)
    ? raw.teams
    : raw?.teams && typeof raw.teams === "object"
      ? Object.values(raw.teams as Record<string, unknown>)
      : [];

  const found = rawTeams.find((item) => {
    const record = getRecord(item);
    const teamId =
      readString(record?.team_id) ??
      readString(record?.teamId) ??
      readString(record?.team);
    return teamId?.toLowerCase() === team?.toLowerCase();
  });

  const record = getRecord(found);
  const won = record?.won ?? record?.has_won;
  return typeof won === "boolean" ? won : undefined;
};

const formatScore = (match: MatchDocument) => {
  if (match.teamScore === undefined || match.enemyScore === undefined)
    return "N/A";
  return `${match.teamScore}:${match.enemyScore}`;
};

const inferRoundsFromTeams = (match: MatchDocument) =>
  match.teamScore !== undefined && match.enemyScore !== undefined
    ? match.teamScore + match.enemyScore
    : 0;

const sortPlayers = (left: DetailPlayer, right: DetailPlayer) =>
  right.acs - left.acs;
const getRecord = (value: unknown) =>
  value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
const readString = (value: unknown) =>
  typeof value === "string" ? value : undefined;
const readNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const readOptionalNumber = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
const readArray = (value: unknown, key: string) => {
  const candidate = getRecord(value)?.[key];
  return Array.isArray(candidate)
    ? candidate.filter((item): item is Record<string, unknown> =>
        Boolean(item && typeof item === "object"),
      )
    : [];
};
const readKillPlayerPuuid = (
  kill: unknown,
  objectKey: string,
  fallbackKey: string,
) => {
  const record = getRecord(kill);
  const candidate = record?.[objectKey];
  if (typeof candidate === "string") return candidate;
  const nestedPuuid = getRecord(candidate)?.puuid;
  return readString(nestedPuuid) ?? readString(record?.[fallbackKey]);
};

const readPlayerTier = (player: Record<string, unknown>) =>
  readOptionalNumber(player.competitive_tier) ??
  readOptionalNumber(player.competitiveTier) ??
  readOptionalNumber(player.currenttier) ??
  readOptionalNumber(player.current_tier) ??
  readOptionalNumber(getRecord(player.tier)?.id) ??
  readOptionalNumber(getRecord(player.rank)?.id);

const readPlayerRank = (player: Record<string, unknown>) =>
  readString(player.currenttierpatched) ??
  readString(player.currentTierPatched) ??
  readString(player.current_tier_patched) ??
  readString(player.competitiveTierName) ??
  readString(getRecord(player.tier)?.name) ??
  readString(getRecord(player.rank)?.name) ??
  readString(player.rank);
