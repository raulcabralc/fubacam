import { EmbedBuilder, User } from "discord.js";

type FeedbackStatus = "success" | "info" | "warning";

const statusConfig: Record<FeedbackStatus, { color: number; icon: string; label: string }> = {
  success: { color: 0x2ecc71, icon: "✅", label: "Completed" },
  info: { color: 0x3498db, icon: "◈", label: "Fubacam" },
  warning: { color: 0xf1c40f, icon: "⚠️", label: "Attention" }
};

export const buildCommandFeedbackEmbed = (input: {
  title: string;
  description: string;
  user: User;
  status?: FeedbackStatus;
}) => {
  const status = statusConfig[input.status ?? "info"];

  return new EmbedBuilder()
    .setAuthor({ name: status.label, iconURL: input.user.client.user?.displayAvatarURL() })
    .setTitle(`${status.icon} ${input.title}`)
    .setDescription(input.description)
    .setColor(status.color)
    .setThumbnail(input.user.displayAvatarURL())
    .setFooter({ text: `Command used by ${input.user.tag}`, iconURL: input.user.displayAvatarURL() })
    .setTimestamp();
};
