import { EmbedBuilder, User } from "discord.js";
import { RankingRow } from "../../services/RankingService";

export const buildRankingEmbed = (rows: RankingRow[], requestedBy?: User) => {
  const description = rows.length
    ? rows
        .map((row, index) => {
          const kd = row.kd.toFixed(2);
          const winRate = `${Math.round(row.winRate * 100)}%`;
          return `**${index + 1}. ${row.riotName}#${row.tagLine}** - ${row.wins}W/${row.matches}J | KD ${kd} | WR ${winRate}`;
        })
        .join("\n")
    : "No matches registered yet.";

  return new EmbedBuilder()
    .setTitle("FBL Internal Ranking")
    .setColor(0xff4655)
    .setDescription(description)
    .setFooter(
      requestedBy
        ? { text: `Command used by ${requestedBy.tag}`, iconURL: requestedBy.displayAvatarURL() }
        : { text: "Fubalicious" }
    )
    .setTimestamp();
};
