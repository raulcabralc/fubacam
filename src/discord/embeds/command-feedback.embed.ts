import { EmbedBuilder, User } from "discord.js";

type FeedbackStatus = "success" | "info" | "warning";

const colors: Record<FeedbackStatus, number> = {
  success: 0x2ecc71,
  info: 0x3498db,
  warning: 0xf1c40f
};

export const buildCommandFeedbackEmbed = (input: {
  title: string;
  description: string;
  user: User;
  status?: FeedbackStatus;
}) =>
  new EmbedBuilder()
    .setTitle(input.title)
    .setDescription(input.description)
    .setColor(colors[input.status ?? "info"])
    .setFooter({ text: `Command used by ${input.user.tag}`, iconURL: input.user.displayAvatarURL() })
    .setTimestamp();
