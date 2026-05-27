import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { buildMatchSummaryEmbed } from "../embeds/match-summary.embed";
import { BotCommand } from "./Command";

export const lastMatchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("lastmatch")
    .setDescription("Show the latest match for a player, fetching from the active provider if needed.")
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(false)),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const user = interaction.options.getUser("user") ?? interaction.user;
    let match = await context.matchService.lastMatch(interaction.guildId, user.id);

    if (match) {
      await interaction.reply({ embeds: [buildMatchSummaryEmbed(match, { matchUser: user, requestedBy: interaction.user })] });
      return;
    }

    const playerDocument = await context.playerService.findByDiscordUser(interaction.guildId, user.id);
    if (!playerDocument) {
      await interaction.reply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "Player Not Registered",
            description: `<@${user.id}> is not registered for FBL tracking yet.`,
            user: interaction.user,
            status: "warning"
          })
        ]
      });
      return;
    }

    await interaction.deferReply();

    const player = context.playerService.toRegisteredPlayer(playerDocument);
    const providerMatches = await context.provider.getRecentMatches(player);

    for (const providerMatch of providerMatches) {
      await context.matchService.saveIfNew(interaction.guildId, player, providerMatch);
    }

    match = await context.matchService.lastMatch(interaction.guildId, user.id);

    if (!match) {
      await interaction.editReply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "No Match Found",
            description: `The ${context.provider.getName()} provider did not return any recent match for <@${user.id}>.`,
            user: interaction.user,
            status: "warning"
          })
        ]
      });
      return;
    }

    await interaction.editReply({ embeds: [buildMatchSummaryEmbed(match, { matchUser: user, requestedBy: interaction.user })] });
  }
};
