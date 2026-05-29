import { MatchDocument } from "../../database/models/Match.model";
import { getMatchSpecialEvents } from "../../services/special-events";

export const getMatchDisplayStats = (match: MatchDocument) => {
  const legacy = match as MatchDocument & {
    firstBlood?: boolean;
    firstDeath?: boolean;
  };
  const firstBloods = match.firstBloods ?? Number(Boolean(legacy.firstBlood));
  const firstDeaths = match.firstDeaths ?? Number(Boolean(legacy.firstDeath));
  const roundsPlayed =
    match.roundsPlayed ??
    (match.teamScore !== undefined && match.enemyScore !== undefined
      ? match.teamScore + match.enemyScore
      : 0);
  const kda = `${match.kills ?? 0}/${match.deaths ?? 0}/${match.assists ?? 0}`;
  const kd = match.deaths
    ? ((match.kills ?? 0) / match.deaths).toFixed(2)
    : String(match.kills ?? 0);
  const mapAndMode =
    [match.map, match.mode ?? match.queue].filter(Boolean).join(" • ") ||
    "Match details pending";
  const score =
    match.teamScore !== undefined && match.enemyScore !== undefined
      ? `${match.teamScore}-${match.enemyScore}`
      : "N/A";
  const duration = match.durationSeconds
    ? `${Math.floor(match.durationSeconds / 60)}m ${match.durationSeconds % 60}s`
    : "N/A";
  const result =
    match.won === undefined
      ? "Unknown result"
      : match.won
        ? "Victory"
        : "Defeat";
  const resultIcon = match.won === undefined ? "🎮" : match.won ? "🏆" : "💢";
  const headshotPercent = match.headshotPercent ?? 0;

  const specialEvents = getMatchSpecialEvents({
    firstBloods,
    firstDeaths,
    combatScore: match.combatScore ?? 0,
    acs: match.combatScore ?? 0,
    kills: match.kills ?? 0,
    deaths: match.deaths ?? 0,
    assists: match.assists ?? 0,
    roundsPlayed,
    rounds: roundsPlayed,
    teamScore: match.teamScore,
    enemyScore: match.enemyScore,
    won: match.won,
    playtimeMillis: match.playtimeMillis ?? 0,
    totalDamage: match.totalDamage ?? 0,
    headshots: match.headshots ?? 0,
    bodyshots: match.bodyshots ?? 0,
    legshots: match.legshots ?? 0,
    headshotPercent,
    bodyshotPercent: match.bodyshotPercent ?? 0,
    legshotPercent: match.legshotPercent ?? 0,
    plants: match.plants ?? 0,
    defuses: match.defuses ?? 0,
    avgLoadoutValue: match.avgLoadoutValue ?? 0,
    totalSpent: match.totalSpent ?? 0,
    totalRemaining: match.totalRemaining ?? 0,
    grenadeCasts: match.grenadeCasts ?? 0,
    ability1Casts: match.ability1Casts ?? 0,
    ability2Casts: match.ability2Casts ?? 0,
    ultimateCasts: match.ultimateCasts ?? 0,
    totalAbilityCasts:
      (match.grenadeCasts ?? 0) +
      (match.ability1Casts ?? 0) +
      (match.ability2Casts ?? 0) +
      (match.ultimateCasts ?? 0),
    multiKills: match.multiKills ?? 0,
    aces: match.aces ?? 0,
    maxKillsInRound: match.maxKillsInRound ?? 0,
  });

  return {
    duration,
    firstBloods,
    firstDeaths,
    headshotPercent,
    kd,
    kda,
    mapAndMode,
    result,
    resultIcon,
    score,
    specialEvents,
  };
};

export const formatSpecialEventNote = (
  events: ReturnType<typeof getMatchSpecialEvents>,
) => {
  if (!events.length) return "";
  return events
    .map((event) => `${event.emoji} **${event.name}**\n${event.description}`)
    .join("\n\n");
};

export const formatRankLine = (match: MatchDocument) => {
  if (!match.rank && match.rr === undefined && match.rrChange === undefined) return undefined;

  const rank = match.rank ?? "Rank unknown";
  const rr = match.rr === undefined ? "" : ` • **${match.rr} RR**`;
  const rrChange = match.rrChange === undefined ? "" : ` (${match.rrChange >= 0 ? "+" : ""}${match.rrChange})`;
  return `Rank **${rank}**${rr}${rrChange}`;
};

export const getTrackerMatchUrl = (providerMatchId: string) =>
  `https://tracker.gg/valorant/match/${providerMatchId}`;

export const getTrackerLink = (providerMatchId: string) => `[Open on tracker.gg](${getTrackerMatchUrl(providerMatchId)})`;
