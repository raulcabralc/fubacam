import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { buildCommandFeedbackEmbed } from "../embeds/command-feedback.embed";
import { BotCommand } from "./Command";

export const streakCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("streak")
    .setDescription("Show the current win/loss streak for a player.")
    .addUserOption((option) => option.setName("user").setDescription("Discord user").setRequired(false)),
  async execute(interaction, context) {
    if (!interaction.guildId) throw new Error("This command can only be used in a server.");

    await interaction.deferReply();

    const user = interaction.options.getUser("user") ?? interaction.user;
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

    const matches = await context.matchService.recentMatches(interaction.guildId, user.id, 10);
    const decidedMatches = matches.filter((match) => match.won !== undefined);

    if (!decidedMatches.length) {
      await interaction.editReply({
        embeds: [
          buildCommandFeedbackEmbed({
            title: "No Streak Yet",
            description: `<@${user.id}> has no stored wins or losses yet.`,
            user: interaction.user,
            status: "warning",
          }),
        ],
      });
      return;
    }

    const currentResult = decidedMatches[0].won;
    const streak = decidedMatches.findIndex((match) => match.won !== currentResult);
    const streakCount = streak === -1 ? decidedMatches.length : streak;
    const record = decidedMatches.reduce(
      (total, match) => {
        if (match.won) total.wins += 1;
        else total.losses += 1;
        return total;
      },
      { wins: 0, losses: 0 },
    );
    const totals = decidedMatches.reduce(
      (total, match) => {
        total.kills += match.kills ?? 0;
        total.deaths += match.deaths ?? 0;
        total.assists += match.assists ?? 0;
        return total;
      },
      { kills: 0, deaths: 0, assists: 0 },
    );
    const kd = totals.deaths ? (totals.kills / totals.deaths).toFixed(2) : String(totals.kills);
    const form = decidedMatches
      .slice(0, 10)
      .map((match) => (match.won ? "🏆" : "🪦"))
      .join(" ");

    const embed = new EmbedBuilder()
      .setAuthor({ name: `${user.username}'s streak`, iconURL: user.displayAvatarURL() })
      .setTitle(`${currentResult ? "🔥 Win Streak" : "🪦 Loss Streak"} • ${streakCount}`)
      .setColor(currentResult ? 0x2ecc71 : 0xe74c3c)
      .setDescription(`<@${user.id}> is currently on a **${streakCount} ${currentResult ? "win" : "loss"} streak**.`)
      .addFields(
        { name: `Last ${decidedMatches.length}`, value: `**${record.wins}W - ${record.losses}L**`, inline: true },
        { name: "K/D", value: `**${kd}**`, inline: true },
        { name: "K / D / A", value: `**${totals.kills}/${totals.deaths}/${totals.assists}**`, inline: true },
        { name: "Recent form", value: `\`${form}\``, inline: false },
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
