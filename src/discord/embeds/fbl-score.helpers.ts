import { MatchDocument } from "../../database/models/Match.model";
import { fblScoreEmoji, fubaEmojis } from "../emojis";
import { getMatchMvpLabel } from "./mvp.helpers";

export const getFblScore = (match: MatchDocument) => {
  const kills = match.kills ?? 0;
  const deaths = match.deaths ?? 0;
  const assists = match.assists ?? 0;
  const acs = match.combatScore ?? 0;
  const firstBloods = match.firstBloods ?? 0;
  const firstDeaths = match.firstDeaths ?? 0;
  const hsPercent = match.headshotPercent ?? 0;
  const rounds = (match.roundsPlayed ?? ((match.teamScore ?? 0) + (match.enemyScore ?? 0))) || 1;
  const kd = deaths > 0 ? kills / deaths : kills;
  const kda = deaths > 0 ? (kills + assists * 0.65) / deaths : kills + assists * 0.65;
  const openingDuelDiff = firstBloods - firstDeaths;
  const mvpLabel = getMatchMvpLabel(match);

  const acsScore = clamp((acs / 320) * 360, 0, 420);
  const kdScore = clamp((kd / 1.6) * 220, 0, 260);
  const kdaScore = clamp((kda / 2.1) * 130, 0, 160);
  const resultScore = match.won ? 90 : 35;
  const headshotScore = clamp((hsPercent / 35) * 70, 0, 90);
  const openingScore = clamp(openingDuelDiff * 18, -80, 90);
  const volumeScore = clamp((kills / rounds) * 90, 0, 90);
  const mvpBonus = mvpLabel ? (mvpLabel === fubaEmojis.matchMvp ? 70 : 40) : 0;
  const deathPenalty = clamp((deaths / rounds - 0.7) * 120, 0, 90);

  return Math.round(clamp(acsScore + kdScore + kdaScore + resultScore + headshotScore + openingScore + volumeScore + mvpBonus - deathPenalty, 0, 1000));
};

export const formatFblScoreLine = (match: MatchDocument) => {
  const score = getFblScore(match);
  return `${fblScoreEmoji} **${getFblScoreGrade(score)}** - **${score}**`;
};

const getFblScoreGrade = (score: number) => {
  if (score >= 800) return "S";
  if (score >= 650) return "A";
  if (score >= 500) return "B";
  if (score >= 300) return "C";
  if (score >= 100) return "D";
  return "Br0s & Ana";
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
