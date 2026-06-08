import { MatchDocument } from "../../database/models/Match.model";
import { fblScoreEmoji, fubaEmojis } from "../emojis";
import { getMatchMvpLabel } from "./mvp.helpers";

export type FblScoreStats = {
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  won?: boolean;
  headshotPercent?: number;
  firstBloods?: number;
  firstDeaths?: number;
  roundsPlayed?: number;
  teamScore?: number;
  enemyScore?: number;
  mvpType?: "match" | "team";
};

export const getFblScore = (match: MatchDocument) =>
  getFblScoreFromStats({
    kills: match.kills ?? 0,
    deaths: match.deaths ?? 0,
    assists: match.assists ?? 0,
    acs: match.combatScore ?? 0,
    won: match.won,
    headshotPercent: match.headshotPercent ?? 0,
    firstBloods: match.firstBloods ?? 0,
    firstDeaths: match.firstDeaths ?? 0,
    roundsPlayed: match.roundsPlayed,
    teamScore: match.teamScore,
    enemyScore: match.enemyScore,
    mvpType: getMvpType(match)
  });

export const getFblScoreFromStats = (stats: FblScoreStats) => {
  const kills = stats.kills;
  const deaths = stats.deaths;
  const assists = stats.assists;
  const acs = stats.acs;
  const firstBloods = stats.firstBloods ?? 0;
  const firstDeaths = stats.firstDeaths ?? 0;
  const hsPercent = stats.headshotPercent ?? 0;
  const rounds = (stats.roundsPlayed ?? ((stats.teamScore ?? 0) + (stats.enemyScore ?? 0))) || 1;
  const kd = deaths > 0 ? kills / deaths : kills;
  const kda = deaths > 0 ? (kills + assists * 0.5) / deaths : kills + assists * 0.5;
  const openingDuelDiff = firstBloods - firstDeaths;

  const acsScore = clamp((acs / 300) * 420, 0, 440);
  const kdScore = clamp(((kd - 0.45) / 1.15) * 220, 0, 240);
  const kdaScore = clamp(((kda - 0.8) / 1.7) * 130, 0, 140);
  const resultScore = stats.won ? 45 : 15;
  const headshotScore = clamp((hsPercent / 40) * 50, 0, 65);
  const openingScore = clamp(openingDuelDiff * 12, -70, 70);
  const volumeScore = clamp((kills / rounds) * 60, 0, 70);
  const mvpBonus = stats.mvpType === "match" ? 60 : stats.mvpType === "team" ? 35 : 0;
  const carryLossBonus = !stats.won && acs >= 230 && kd >= 1.05 ? clamp((acs - 230) * 0.35 + (kd - 1.05) * 70, 0, 55) : 0;
  const lowAcsPenalty = acs < 120 ? (120 - acs) * 1.2 : 0;
  const badKdPenalty = kd < 0.75 ? (0.75 - kd) * 160 : 0;
  const deathRatePenalty = clamp((deaths / rounds - 0.72) * 140, 0, 90);

  return Math.round(
    clamp(
      acsScore +
        kdScore +
        kdaScore +
        resultScore +
        headshotScore +
        openingScore +
        volumeScore +
        mvpBonus +
        carryLossBonus -
        lowAcsPenalty -
        badKdPenalty -
        deathRatePenalty,
      0,
      1000,
    ),
  );
};

export const formatFblScoreLine = (match: MatchDocument) => {
  const score = getFblScore(match);
  return `${fblScoreEmoji} **${getFblScoreGrade(score)}**  -  **${score}** FBS`;
};

export const formatInlineFblScore = (score: number) => `${fblScoreEmoji} **${getFblScoreGrade(score)}** - **${score}**`;

export const getFblScoreGrade = (score: number) => {
  if (score >= 800) return "S";
  if (score >= 650) return "A";
  if (score >= 500) return "B";
  if (score >= 300) return "C";
  if (score >= 100) return "D";
  return "Br0s & Ana";
};

const getMvpType = (match: MatchDocument) => {
  const mvpLabel = getMatchMvpLabel(match);
  if (mvpLabel === fubaEmojis.matchMvp) return "match";
  if (mvpLabel === fubaEmojis.teamMvp) return "team";
  return undefined;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
