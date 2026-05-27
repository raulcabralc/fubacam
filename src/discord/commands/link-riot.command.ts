import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const linkRiotCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("link-riot")
    .setDescription("Link your Riot account with Riot Sign On for official Valorant tracking."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    if (!context.riotAuthService) throw new Error("Riot OAuth is not enabled in this bot.");

    const url = await context.riotAuthService.createAuthorizationUrl({
      guildId: interaction.guildId,
      discordUserId: interaction.user.id
    });

    await interaction.reply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: "Link Riot Account",
          description: `<@${interaction.user.id}> started Riot account linking.\n\nAuthorize here: ${url}\n\nThis link expires in 10 minutes.`,
          user: interaction.user,
          status: "info"
        })
      ]
    });
  }
};
