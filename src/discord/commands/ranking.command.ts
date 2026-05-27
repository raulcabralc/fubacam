import { SlashCommandBuilder } from "discord.js";
import { buildRankingEmbed } from "../embeds/ranking.embed";
import { BotCommand } from "./Command";

export const rankingCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("ranking").setDescription("Show the internal FBL ranking."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const rows = await context.rankingService.getGuildRanking(interaction.guildId);
    await interaction.reply({ embeds: [buildRankingEmbed(rows, interaction.user)] });
  }
};
