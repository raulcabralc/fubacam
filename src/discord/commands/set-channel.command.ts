import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const setChannelCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("set-channel")
    .setDescription("Set the channel where match summaries will be posted.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Summary channel")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const channel = interaction.options.getChannel("channel", true);
    const permissions = "permissionsFor" in channel ? channel.permissionsFor(interaction.client.user.id) : undefined;

    if (
      !permissions?.has(PermissionFlagsBits.ViewChannel) ||
      !permissions.has(PermissionFlagsBits.SendMessages) ||
      !permissions.has(PermissionFlagsBits.EmbedLinks)
    ) {
      await interaction.reply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "Missing Channel Access",
            description: `I need **View Channel**, **Send Messages**, and **Embed Links** permissions in <#${channel.id}> before it can be used for match summaries.`,
            user: interaction.user,
            status: "warning"
          })
        ]
      });
      return;
    }

    await context.guildSettingsService.setChannel(interaction.guildId, channel.id);
    await interaction.reply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: "Summary Channel Set",
          description: `<@${interaction.user.id}> set match summaries to <#${channel.id}>.`,
          user: interaction.user,
          status: "success"
        })
      ]
    });
  }
};
