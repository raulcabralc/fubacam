import { EmbedBuilder, User } from "discord.js";
import { RankingRow } from "../../services/RankingService";
import { fubaEmojis, getLeaderboardMedal } from "../emojis";

export const buildRankingEmbed = (rows: RankingRow[], requestedBy?: User) => {
  const description = rows.length
    ? rows
        .map((row, index) => {
          const medal = getLeaderboardMedal(index);
          const kd = row.kd.toFixed(2);
          const winRate = `${Math.round(row.winRate * 100)}%`;
          return `${medal} **${row.riotName}#${row.tagLine}**\n${row.wins}W in ${row.matches} matches • KD ${kd} • WR ${winRate} • ${fubaEmojis.firstBlood} FB ${row.firstBloods} • ${fubaEmojis.firstDeath} FD ${row.firstDeaths}`;
        })
        .join("\n\n")
    : "No matches registered yet. Wait for the next tracking cycle.";

  return new EmbedBuilder()
    .setAuthor({ name: "Fubacam Rankings", iconURL: requestedBy?.client.user?.displayAvatarURL() })
    .setTitle("FBL Internal Ranking")
    .setColor(0xf1c40f)
    .setDescription(description)
    .setTimestamp();
};
