import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";

export const buildMatchSummaryEmbed = (match: MatchDocument, requestedBy?: User) => {
  const result = match.won === undefined ? "Unknown" : match.won ? "Victory" : "Defeat";
  const score = match.teamScore !== undefined && match.enemyScore !== undefined ? `${match.teamScore}-${match.enemyScore}` : "N/A";
  const kda = `${match.kills ?? 0}/${match.deaths ?? 0}/${match.assists ?? 0}`;

  return new EmbedBuilder()
    .setTitle(`FBL Match: ${result}`)
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .setDescription(`${match.riotName}#${match.tagLine}`)
    .addFields(
      { name: "Map", value: match.map ?? "Unknown", inline: true },
      { name: "Mode", value: match.mode ?? match.queue ?? "Unknown", inline: true },
      { name: "Score", value: score, inline: true },
      { name: "Agent", value: match.agent ?? "Unknown", inline: true },
      { name: "K/D/A", value: kda, inline: true },
      { name: "ACS", value: String(match.combatScore ?? "N/A"), inline: true }
    )
    .setTimestamp(match.startedAt)
    .setFooter({
      text: requestedBy ? `Provider: ${match.provider} | Requested by ${requestedBy.tag}` : `Provider: ${match.provider}`,
      iconURL: requestedBy?.displayAvatarURL()
    });
};
