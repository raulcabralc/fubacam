import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const playersCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("players").setDescription("List registered FBL players."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const players = await context.playerService.listByGuild(interaction.guildId);
    const content = players.length
      ? players.map((player) => `<@${player.discordUserId}> - **${player.riotName}#${player.tagLine}**`).join("\n")
      : "No players registered yet.";
    await interaction.reply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: "Registered Players",
          description: content,
          user: interaction.user,
          status: "info"
        })
      ]
    });
  }
};
