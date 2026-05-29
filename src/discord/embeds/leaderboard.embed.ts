import { EmbedBuilder } from "discord.js";
import { PlayerMmr } from "../../services/HenrikMmrService";

export const buildLeaderboardEmbed = (rows: PlayerMmr[]) => {
  const description = rows.length
    ? rows
        .map((row, index) => {
          const medal = ["🥇", "🥈", "🥉"][index] ?? `#${index + 1}`;
          const rrChange = row.lastChange === undefined ? "" : ` (${row.lastChange >= 0 ? "+" : ""}${row.lastChange})`;
          const leaderboard = row.leaderboardRank ? ` • #${row.leaderboardRank}` : "";
          return `${medal} **${row.riotName}#${row.tagLine}**\n${row.rank} • **${row.rr} RR**${rrChange}${leaderboard}`;
        })
        .join("\n\n")
    : "No ranked data found for registered players.";

  return new EmbedBuilder()
    .setTitle("🏆 FBL Ranked Leaderboard")
    .setColor(0xff4655)
    .setDescription(description)
    .setTimestamp();
};
