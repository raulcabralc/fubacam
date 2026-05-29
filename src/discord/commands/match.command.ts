import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { buildMatchSummaryEmbed } from "../embeds/match-summary.embed";
import { BotCommand } from "./Command";

export const matchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("match")
    .setDescription("Show a detailed stored match by index. Index 1 is the latest match.")
    .addIntegerOption((option) =>
      option
        .setName("index")
        .setDescription("Match index, starting at 1 for the latest match.")
        .setRequired(false)
        .setMinValue(1),
    )
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(false)),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");

    const index = interaction.options.getInteger("index") ?? 1;
    const user = interaction.options.getUser("user") ?? interaction.user;

    await interaction.deferReply();

    if (index === 1) {
      const playerDocument = await context.playerService.findByDiscordUser(interaction.guildId, user.id);
      if (playerDocument) {
        const player = context.playerService.toRegisteredPlayer(playerDocument);

        if (context.provider.getName() === "henrik") {
          await context.matchService.deleteMalformedProviderMatches(interaction.guildId, user.id, "henrik");
        }

        const providerMatches = await context.provider.getRecentMatches(player);
        for (const providerMatch of providerMatches) {
          await context.matchService.saveIfNew(interaction.guildId, player, providerMatch);
        }
      }
    }

    const match = await context.matchService.matchByIndex(interaction.guildId, user.id, index);

    if (!match) {
      await interaction.editReply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "Match Not Found",
            description: `No stored match found for <@${user.id}> at index **${index}**.`,
            user: interaction.user,
            status: "warning",
          }),
        ],
      });
      return;
    }

    await interaction.editReply({ embeds: [buildMatchSummaryEmbed(match, { matchUser: user, requestedBy: interaction.user })] });
  },
};
