import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";
import { resolveValorantAgentAsset } from "../../utils/valorant-assets";
import { getAgentEmoji } from "../emojis";
import { formatRankLine, formatSpecialEventNote, getMatchDisplayStats, getTrackerLink } from "./match-embed.helpers";
import { getMatchMvpLabel } from "./mvp.helpers";

export const buildCompactMatchSummaryEmbed = (match: MatchDocument, options?: { matchUser?: User; timestamp?: Date }) => {
  const stats = getMatchDisplayStats(match);
  const agent = resolveValorantAgentAsset(match.agent);
  const agentName = agent?.name ?? "Unknown";
  const agentLabel = `${getAgentEmoji(agentName)} ${agentName}`;
  const playerName = `${match.riotName}#${match.tagLine}`;
  const userLabel = options?.matchUser ? ` (${options.matchUser.username})` : "";
  const rankLine = formatRankLine(match);
  const mvpLabel = getMatchMvpLabel(match);
  const acs = match.combatScore ?? "N/A";

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${playerName}${userLabel}`,
      iconURL: options?.matchUser?.displayAvatarURL() ?? agent?.imageUrl,
    })
    .setTitle(`${stats.resultIcon} ${stats.result}${stats.score !== "N/A" ? ` ${stats.score.replace("-", " - ")}` : ""}`)
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .setDescription(
      [
        stats.mapAndMode,
        mvpLabel,
        `**${agentLabel}** • KDA **${stats.kda}** • K/D **${stats.kd}** • ACS **${acs}**`,
        rankLine,
        getTrackerLink(match.providerMatchId),
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .setTimestamp(options?.timestamp ?? match.startedAt);

  if (stats.specialEvents.length) {
    embed.addFields({
      name: "Special Events",
      value: formatSpecialEventNote(stats.specialEvents),
      inline: false,
    });
  }

  if (agent?.imageUrl) {
    embed.setThumbnail(agent.imageUrl);
  }

  return embed;
};
