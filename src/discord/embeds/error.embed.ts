import { EmbedBuilder, User } from "discord.js";

export const buildErrorEmbed = (message: string, user?: User) => {
  const embed = new EmbedBuilder().setTitle("Could not complete action").setColor(0xe74c3c).setDescription(message);

  if (user) {
    embed.setFooter({ text: `Command used by ${user.tag}`, iconURL: user.displayAvatarURL() }).setTimestamp();
  }

  return embed;
};
