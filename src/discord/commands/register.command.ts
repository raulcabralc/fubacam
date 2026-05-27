import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const registerCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your Riot account for FBL match tracking.")
    .addStringOption((option) => option.setName("riotname").setDescription("Riot name").setRequired(true))
    .addStringOption((option) => option.setName("tagline").setDescription("Riot tag line").setRequired(true)),
  async execute(interaction, context) {
    const guildId = interaction.guildId;
    if (!guildId) throw new Error("This command can only be used in a server.");

    const riotName = interaction.options.getString("riotname", true).trim();
    const tagLine = interaction.options.getString("tagline", true).replace(/^#/, "").trim();
    const player = await context.playerService.register({
      guildId,
      discordUserId: interaction.user.id,
      riotName,
      tagLine
    });

    await interaction.reply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: "Player Registered",
          description: `<@${interaction.user.id}> registered **${player.riotName}#${player.tagLine}** for FBL tracking.`,
          user: interaction.user,
          status: "success"
        })
      ]
    });
  }
};
