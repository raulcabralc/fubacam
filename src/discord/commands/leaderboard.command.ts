import { SlashCommandBuilder } from "discord.js";
import { buildLeaderboardEmbed } from "../embeds/leaderboard.embed";
import { BotCommand } from "./Command";

export const leaderboardCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("leaderboard").setDescription("Show registered players ranked by Valorant rank and RR."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");

    await interaction.deferReply();

    const players = await context.playerService.listByGuild(interaction.guildId);
    const rows = await context.henrikMmrService.getGuildLeaderboard(
      players.map((player) => ({
        riotName: player.riotName,
        tagLine: player.tagLine,
        discordUserId: player.discordUserId
      }))
    );

    await interaction.editReply({ embeds: [buildLeaderboardEmbed(rows)] });
  }
};
