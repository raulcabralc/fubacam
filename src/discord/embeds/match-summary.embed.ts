import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";
import { resolveValorantAgentAsset } from "../../utils/valorant-assets";
import { fubaEmojis, getAgentEmoji } from "../emojis";
import { formatInlineFblScore, getFblScore } from "./fbl-score.helpers";
import {
  formatRankLine,
  formatSpecialEventNote,
  getMatchDisplayStats,
  getTrackerLink,
} from "./match-embed.helpers";
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
  const playerName = `${match.riotName}#${match.tagLine}`;
  const userLabel = options?.matchUser
    ? ` (${options.matchUser.username})`
    : "";
  const rankLine = formatRankLine(match);
  const mvpLabel = getMatchMvpLabel(match);
  const titleScore =
    stats.score === "N/A" ? "" : stats.score.replace("-", " - ");
  const fblScore = getFblScore(match);

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${playerName}${userLabel}`,
      iconURL:
        options?.matchUser?.displayAvatarURL() ??
        agent?.imageUrl ??
        options?.requestedBy?.client.user?.displayAvatarURL(),
    })
    .setTitle(
      `${stats.resultIcon} ${stats.result} ${titleScore} ${match.map ? `on ${match.map}` : ""} ${mvpLabel ?? ""}`.trim(),
    )
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .setDescription(
      [stats.mapAndMode, rankLine, getTrackerLink(match.providerMatchId)]
        .filter(Boolean)
        .join("\n"),
    )
    .addFields(
      {
        name: `${getAgentEmoji(agentName)} Agent`,
        value: agentName,
        inline: true,
      },
      {
        name: `${fubaEmojis.duration} Duration`,
        value: stats.duration,
        inline: true,
      },
      {
        name: `${fubaEmojis.acs} ACS`,
        value: String(match.combatScore ?? "N/A"),
        inline: true,
      },
      { name: "K / D / A", value: stats.kda, inline: true },
      { name: "K/D", value: stats.kd, inline: true },
      { name: "HS%", value: `${stats.headshotPercent}%`, inline: true },
      { name: "First Blood", value: String(stats.firstBloods), inline: true },
      { name: "First Death", value: String(stats.firstDeaths), inline: true },
      { name: "\u200B", value: "\u200B", inline: true },
      {
        name: "FBL Score",
        value: formatInlineFblScore(fblScore),
        inline: true,
      },
    )
    .setTimestamp(match.startedAt);

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
