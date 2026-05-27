import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { buildMatchSummaryEmbed } from "../embeds/match-summary.embed";
import { MockMatchProvider } from "../../providers/MockMatchProvider";
import { BotCommand } from "./Command";

export const mockMatchCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("mock-match").setDescription("Generate a fake match to test the full flow."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const playerDocument = await context.playerService.findByDiscordUser(interaction.guildId, interaction.user.id);
    if (!playerDocument) {
      await interaction.reply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "Registration Required",
            description: `<@${interaction.user.id}> needs to register with /register before generating a mock match.`,
            user: interaction.user,
            status: "warning"
          })
        ]
      });
      return;
    }

    await interaction.deferReply();
    const player = context.playerService.toRegisteredPlayer(playerDocument);
    const fakeMatch = new MockMatchProvider().createFakeMatch(player);
    const result = await context.matchService.saveAndPost(interaction.client, interaction.guildId, player, fakeMatch);

    if (!result.match) {
      await interaction.editReply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "Mock Match Failed",
            description: "Could not save mock match.",
            user: interaction.user,
            status: "warning"
          })
        ]
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: "Mock Match Saved",
          description: `<@${interaction.user.id}> generated a fake match for testing.`,
          user: interaction.user,
          status: "success"
        }),
        buildMatchSummaryEmbed(result.match, { matchUser: interaction.user, requestedBy: interaction.user })
      ]
    });
  }
};
