import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";
import { resolveValorantAgentAsset } from "../../utils/valorant-assets";
import { fubaEmojis, getAgentEmoji } from "../emojis";
import { formatRankLine, formatSpecialEventNote, getMatchDisplayStats, getTrackerLink } from "./match-embed.helpers";
import { getMatchMvpLabel } from "./mvp.helpers";

export const buildMatchSummaryEmbed = (
  match: MatchDocument,
  options?: {
    matchUser?: User;
    requestedBy?: User;
  },
) => {
  const stats = getMatchDisplayStats(match);
  const agent = resolveValorantAgentAsset(match.agent);
  const agentName = agent?.name ?? "Unknown";
  const agentLabel = `${getAgentEmoji(agentName)} ${agentName}`;
  const playerName = `${match.riotName}#${match.tagLine}`;
  const userLabel = options?.matchUser ? ` (${options.matchUser.username})` : "";
  const rankLine = formatRankLine(match);
  const mvpLabel = getMatchMvpLabel(match);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${playerName}${userLabel}`,
      iconURL: options?.matchUser?.displayAvatarURL() ?? agent?.imageUrl ?? options?.requestedBy?.client.user?.displayAvatarURL(),
    })
    .setTitle(`${stats.resultIcon} ${stats.result} ${stats.score !== "N/A" ? stats.score : ""} ${match.map ? `on ${match.map}` : ""}`.trim())
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .setDescription(
      [`**${playerName}** played ${agentLabel}`, stats.mapAndMode, mvpLabel, rankLine, getTrackerLink(match.providerMatchId)]
        .filter(Boolean)
        .join("\n"),
    )
    .addFields(
      { name: `${fubaEmojis.agent} Agent`, value: agentLabel, inline: true },
      { name: `${fubaEmojis.duration} Duration`, value: stats.duration, inline: true },
      { name: "\u200B", value: "\u200B", inline: true },
      { name: `${fubaEmojis.kda} K / D / A`, value: stats.kda, inline: true },
      { name: `${fubaEmojis.kd} K/D`, value: stats.kd, inline: true },
      { name: `${fubaEmojis.acs} ACS`, value: String(match.combatScore ?? "N/A"), inline: true },
      { name: `${fubaEmojis.firstBlood} First Bloods`, value: `**${stats.firstBloods}**`, inline: true },
      { name: `${fubaEmojis.firstDeath} First Deaths`, value: `**${stats.firstDeaths}**`, inline: true },
      { name: `${fubaEmojis.headshot} HS%`, value: `**${stats.headshotPercent}%**`, inline: true },
    )
    .setTimestamp(match.startedAt);

  if (stats.specialEvents.length) {
    embed.addFields({
      name: `${fubaEmojis.specialEvents} Special Events`,
      value: formatSpecialEventNote(stats.specialEvents),
      inline: false,
    });
  }

  if (agent?.imageUrl) {
    embed.setThumbnail(agent.imageUrl);
  }

  return embed;
};
