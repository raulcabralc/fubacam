import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const unregisterCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("unregister").setDescription("Remove your FBL match tracking registration."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const player = await context.playerService.unregister(interaction.guildId, interaction.user.id);
    await interaction.reply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: player ? "Player Unregistered" : "No Registration Found",
          description: player
            ? `<@${interaction.user.id}> removed their FBL tracking registration.`
            : `<@${interaction.user.id}> tried to unregister, but was not registered.`,
          user: interaction.user,
          status: player ? "success" : "warning"
        })
      ]
    });
  }
};
