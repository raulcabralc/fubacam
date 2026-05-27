import { SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const trackingStatusCommand: BotCommand = {
  data: new SlashCommandBuilder().setName("tracking-status").setDescription("Show FBL tracking status."),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");
    const status = context.trackingService.getStatus();
    const settings = await context.guildSettingsService.getOrCreate(interaction.guildId);
    const lastCheck = settings.lastTrackingCheckAt?.toISOString() ?? "never";
    await interaction.reply({
      embeds: [
        buildCommandFeedbackEmbed({
          title: "Tracking Status",
          description: [
        `Active now: **${status.active ? "yes" : "no"}**`,
        `Provider: **${status.provider}**`,
        `Last guild check: **${lastCheck}**`,
        `Summary channel: ${settings.summaryChannelId ? `<#${settings.summaryChannelId}>` : "**not set**"}`
          ].join("\n"),
          user: interaction.user,
          status: "info"
        })
      ]
    });
  }
};
