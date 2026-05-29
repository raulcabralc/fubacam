import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";
import { getMatchDisplayStats, getTrackerLink } from "./match-embed.helpers";

type DetailPlayer = {
  name: string;
  tag: string;
  team: string;
  agent: string;
  kills: number;
  deaths: number;
  assists: number;
  score: number;
  acs: number;
  won?: boolean;
};

export const buildMatchDetailsEmbed = (match: MatchDocument, _requestedBy?: User) => {
  const stats = getMatchDisplayStats(match);
  const teams = groupTeams(extractPlayers(match));

  const embed = new EmbedBuilder()
    .setTitle(`${stats.resultIcon} Match Details ${stats.score !== "N/A" ? stats.score : ""}`.trim())
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .setDescription(`**${stats.mapAndMode}** • ${stats.duration}\n${getTrackerLink(match.providerMatchId)}`)
    .addFields(
      { name: teamHeader("Team A", teams[0] ?? []), value: formatTeam(teams[0] ?? [], "Team A"), inline: false },
      { name: teamHeader("Team B", teams[1] ?? []), value: formatTeam(teams[1] ?? [], "Team B"), inline: false },
    )
    .setTimestamp(match.startedAt);

  return embed;
};

const extractPlayers = (match: MatchDocument): DetailPlayer[] => {
  const raw = match.raw as { players?: unknown; metadata?: { rounds_played?: number } } | undefined;
  const rawPlayers = Array.isArray(raw?.players)
    ? raw.players
    : raw?.players && typeof raw.players === "object" && Array.isArray((raw.players as { all_players?: unknown[] }).all_players)
      ? (raw.players as { all_players: unknown[] }).all_players
      : [];

  return rawPlayers
    .filter((player): player is Record<string, unknown> => Boolean(player && typeof player === "object"))
    .map((player) => {
      const stats = getRecord(player.stats);
      const score = readNumber(stats?.score);
      const rounds = readNumber(raw?.metadata?.rounds_played) || inferRoundsFromTeams(match);
      const team = readString(player.team_id) ?? readString(player.team) ?? "Unknown";

      return {
        name: readString(player.name) ?? "Unknown",
        tag: readString(player.tag) ?? "",
        team,
        agent: readString(getRecord(player.agent)?.name) ?? readString(player.character) ?? "Unknown",
        kills: readNumber(stats?.kills),
        deaths: readNumber(stats?.deaths),
        assists: readNumber(stats?.assists),
        score,
        acs: rounds ? Math.round(score / rounds) : 0,
        won: readTeamWon(match, team),
      };
    })
    .sort((left, right) => right.acs - left.acs);
};

const groupTeams = (players: DetailPlayer[]) => {
  const teams = new Map<string, DetailPlayer[]>();
  for (const player of players) {
    const key = player.team.toLowerCase();
    teams.set(key, [...(teams.get(key) ?? []), player]);
  }

  return Array.from(teams.values()).sort(
    (left, right) => Number(Boolean(right[0]?.won)) - Number(Boolean(left[0]?.won)),
  );
};

const formatTeam = (players: DetailPlayer[], team: "Team A" | "Team B") => {
  if (!players.length) return "No player data available.";
  const bullet = team === "Team A" ? "▸" : "▹";

  const rows = players
    .map((player) => {
      const riotId = player.tag ? `${player.name}#${player.tag}` : player.name;
      return `${bullet} **${riotId}** - ${player.agent}\n\`ACS ${player.acs}\`  \`KDA ${player.kills}/${player.deaths}/${player.assists}\``;
    })
    .join("\n\n");

  return rows.slice(0, 1024);
};

const teamHeader = (team: "Team A" | "Team B", players: DetailPlayer[]) => {
  const emoji = team === "Team A" ? "🛡️" : "⚔️";
  const totalKills = players.reduce((total, player) => total + player.kills, 0);
  const won = players.some((player) => player.won);
  return `${emoji} ${team}${won ? " • WIN" : ""} • ${totalKills} kills`;
};

const readTeamWon = (match: MatchDocument, team?: string) => {
  const raw = match.raw as { teams?: unknown } | undefined;
  const teams = Array.isArray(raw?.teams) ? raw.teams : [];
  const found = teams.find(
    (item) =>
      item &&
      typeof item === "object" &&
      readString((item as Record<string, unknown>).team_id)?.toLowerCase() === team?.toLowerCase(),
  );
  return found && typeof found === "object" ? Boolean((found as Record<string, unknown>).won) : undefined;
};

const inferRoundsFromTeams = (match: MatchDocument) =>
  match.teamScore !== undefined && match.enemyScore !== undefined ? match.teamScore + match.enemyScore : 0;

const getRecord = (value: unknown) => (value && typeof value === "object" ? (value as Record<string, unknown>) : undefined);
const readString = (value: unknown) => (typeof value === "string" ? value : undefined);
const readNumber = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0);
