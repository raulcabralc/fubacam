import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { buildMatchDetailsEmbed } from "../embeds/match-details.embed";
import { BotCommand } from "./Command";

export const matchDetailsCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("match-details")
    .setDescription("Show a full post-match summary with both teams.")
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
    const match = await context.matchService.matchByIndex(interaction.guildId, user.id, index);

    if (!match) {
      await interaction.reply({
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

    await interaction.reply({ embeds: [buildMatchDetailsEmbed(match, interaction.user)] });
  },
};
