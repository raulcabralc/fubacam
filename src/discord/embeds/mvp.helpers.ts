import { MatchDocument } from "../../database/models/Match.model";
import { fubaEmojis } from "../emojis";

type MvpPlayer = {
  riotId: string;
  team: string;
  acs: number;
};

export const getMatchMvpLabel = (match: MatchDocument) => {
  const players = extractPlayers(match);
  if (!players.length) return undefined;

  const targetRiotId = `${match.riotName}#${match.tagLine}`.toLowerCase();
  const target = players.find((player) => player.riotId.toLowerCase() === targetRiotId);
  if (!target) return undefined;

  const matchMvpAcs = Math.max(...players.map((player) => player.acs));
  if (target.acs === matchMvpAcs) return `${fubaEmojis.matchMvp} Match MVP`;

  const teamMvpAcs = Math.max(...players.filter((player) => player.team === target.team).map((player) => player.acs));
  if (target.acs === teamMvpAcs) return `${fubaEmojis.teamMvp} Team MVP`;

  return undefined;
};

const extractPlayers = (match: MatchDocument): MvpPlayer[] => {
  const raw = getRecord(match.raw);
  const rawPlayers = Array.isArray(raw?.players)
    ? raw.players
    : raw?.players && typeof raw.players === "object" && Array.isArray((raw.players as { all_players?: unknown[] }).all_players)
      ? (raw.players as { all_players: unknown[] }).all_players
      : [];
  const rounds = readNumber(getRecord(raw?.metadata)?.rounds_played) || inferRoundsFromTeams(match) || 1;

  return rawPlayers
    .filter((player): player is Record<string, unknown> => Boolean(player && typeof player === "object"))
    .map((player) => {
      const stats = getRecord(player.stats);
      const name = readString(player.name) ?? readString(player.gameName) ?? "Unknown";
      const tag = readString(player.tag) ?? readString(player.tagLine) ?? "";
      const score = readNumber(stats?.score);

      return {
        riotId: tag ? `${name}#${tag}` : name,
        team: readString(player.team_id) ?? readString(player.teamId) ?? readString(player.team) ?? "Unknown",
        acs: Math.round(score / rounds)
      };
    });
};

const inferRoundsFromTeams = (match: MatchDocument) =>
  match.teamScore !== undefined && match.enemyScore !== undefined ? match.teamScore + match.enemyScore : 0;

const getRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : undefined);
const readString = (value: unknown) => (typeof value === "string" ? value : undefined);
const readNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
