import { EmbedBuilder, User } from "discord.js";
import { MatchDocument } from "../../database/models/Match.model";
import { getMatchSpecialEvents } from "../../services/special-events";
import { resolveValorantAgentAsset } from "../../utils/valorant-assets";

export const buildMatchSummaryEmbed = (
  match: MatchDocument,
  options?: {
    matchUser?: User;
    requestedBy?: User;
  }
) => {
  const result = match.won === undefined ? "Unknown result" : match.won ? "Victory" : "Defeat";
  const resultIcon = match.won === undefined ? "🎮" : match.won ? "🏆" : "💢";
  const score = match.teamScore !== undefined && match.enemyScore !== undefined ? `${match.teamScore}-${match.enemyScore}` : "N/A";
  const kda = `${match.kills ?? 0}/${match.deaths ?? 0}/${match.assists ?? 0}`;
  const kd = match.deaths ? ((match.kills ?? 0) / match.deaths).toFixed(2) : String(match.kills ?? 0);
  const agent = resolveValorantAgentAsset(match.agent);
  const agentName = agent?.name ?? "Unknown";
  const duration = match.durationSeconds ? `${Math.floor(match.durationSeconds / 60)}m ${match.durationSeconds % 60}s` : "N/A";
  const mapAndMode = [match.map, match.mode ?? match.queue].filter(Boolean).join(" • ") || "Match details pending";
  const legacy = match as MatchDocument & { firstBlood?: boolean; firstDeath?: boolean };
  const firstBloods = match.firstBloods ?? Number(Boolean(legacy.firstBlood));
  const firstDeaths = match.firstDeaths ?? Number(Boolean(legacy.firstDeath));
  const playerName = `${match.riotName}#${match.tagLine}`;
  const userLabel = options?.matchUser ? ` (${options.matchUser.username})` : "";
  const specialEvents = getMatchSpecialEvents({ firstBloods, firstDeaths });

  const embed = new EmbedBuilder()
    .setAuthor({
      name: `${playerName}${userLabel}`,
      iconURL: options?.matchUser?.displayAvatarURL() ?? agent?.imageUrl ?? options?.requestedBy?.client.user?.displayAvatarURL()
    })
    .setTitle(`${resultIcon} ${result} ${match.map ? `on ${match.map}` : ""}`.trim())
    .setColor(match.won ? 0x2ecc71 : 0xe74c3c)
    .setDescription(`**${playerName}** played ${agentName}\n${mapAndMode}`)
    .addFields(
      { name: "🎯 Agent", value: agentName, inline: true },
      { name: "📊 Score", value: score, inline: true },
      { name: "⏳ Duration", value: duration, inline: true },
      { name: "🗡️ K / D / A", value: kda, inline: true },
      { name: "📈 K/D", value: kd, inline: true },
      { name: "🔥 ACS", value: String(match.combatScore ?? "N/A"), inline: true },
      { name: "🩸 First Bloods", value: `**${firstBloods}**`, inline: true },
      { name: "💀 First Deaths", value: `**${firstDeaths}**`, inline: true },
      { name: "\u200B", value: "\u200B", inline: true }
    )
    .setTimestamp(match.startedAt)
    .setFooter({
      text: options?.requestedBy
        ? `Provider: ${match.provider} | Requested by ${options.requestedBy.tag}`
        : `Provider: ${match.provider}`,
      iconURL: options?.requestedBy?.displayAvatarURL()
    });

  if (specialEvents.length) {
    embed.addFields({
      name: "✨ Special Events",
      value: specialEvents.map((event) => `${event.emoji} **${event.name}** - ${event.description}`).join("\n"),
      inline: false
    });
  }

  if (agent?.imageUrl) {
    embed.setThumbnail(agent.imageUrl);
  }

  return embed;
};
