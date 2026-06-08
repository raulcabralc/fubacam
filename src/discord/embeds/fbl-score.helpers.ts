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
  const kda = deaths > 0 ? (kills + assists * 0.5) / deaths : kills + assists * 0.5;
  const openingDuelDiff = firstBloods - firstDeaths;
  const mvpLabel = getMatchMvpLabel(match);

  const acsScore = clamp((acs / 300) * 420, 0, 440);
  const kdScore = clamp(((kd - 0.45) / 1.15) * 220, 0, 240);
  const kdaScore = clamp(((kda - 0.8) / 1.7) * 130, 0, 140);
  const resultScore = match.won ? 45 : 15;
  const headshotScore = clamp((hsPercent / 40) * 50, 0, 65);
  const openingScore = clamp(openingDuelDiff * 12, -70, 70);
  const volumeScore = clamp((kills / rounds) * 60, 0, 70);
  const mvpBonus = mvpLabel ? (mvpLabel === fubaEmojis.matchMvp ? 60 : 35) : 0;
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
        mvpBonus -
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

const getFblScoreGrade = (score: number) => {
  if (score >= 800) return "S";
  if (score >= 650) return "A";
  if (score >= 500) return "B";
  if (score >= 300) return "C";
  if (score >= 100) return "D";
  return "Br0s & Ana";
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
