import { EmbedBuilder, User } from "discord.js";
import { RankingRow } from "../../services/RankingService";

export const buildRankingEmbed = (rows: RankingRow[], requestedBy?: User) => {
  const description = rows.length
    ? rows
        .map((row, index) => {
          const medal = ["🥇", "🥈", "🥉"][index] ?? `#${index + 1}`;
          const kd = row.kd.toFixed(2);
          const winRate = `${Math.round(row.winRate * 100)}%`;
          return `${medal} **${row.riotName}#${row.tagLine}**\n${row.wins}W in ${row.matches} matches • KD ${kd} • WR ${winRate} • 🩸 FB ${row.firstBloods} • 💀 FD ${row.firstDeaths}`;
        })
        .join("\n\n")
    : "No matches registered yet. Generate a mock match or wait for the next tracking cycle.";

  return new EmbedBuilder()
    .setAuthor({ name: "Fubacam Rankings", iconURL: requestedBy?.client.user?.displayAvatarURL() })
    .setTitle("🏁 FBL Internal Ranking")
    .setColor(0xf1c40f)
    .setDescription(description)
    .setFooter(
      requestedBy
        ? { text: `Command used by ${requestedBy.tag}`, iconURL: requestedBy.displayAvatarURL() }
        : { text: "Fubalicious" }
    )
    .setTimestamp();
};
