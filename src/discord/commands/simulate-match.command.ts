import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const simulateMatchCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("simulate-match")
    .setDescription("Temporarily repost a stored match as if it just ended.")
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

    await interaction.deferReply();

    const index = interaction.options.getInteger("index") ?? 1;
    const user = interaction.options.getUser("user") ?? interaction.user;

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
    if (!match?._id) {
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

    const posted = await context.matchService.postMatchSummary(interaction.client, interaction.guildId, String(match._id), {
      force: true,
      markPosted: false,
      simulateFinishedNow: true,
    });

    await interaction.editReply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: posted ? "Match Simulated" : "Summary Channel Missing",
          description: posted
            ? `Posted <@${user.id}>'s match **#${index}** as if it just ended.`
            : "Set a summary channel with `/set-channel` before simulating match posts.",
          user: interaction.user,
          status: posted ? "success" : "warning",
        }),
      ],
    });
  },
};
