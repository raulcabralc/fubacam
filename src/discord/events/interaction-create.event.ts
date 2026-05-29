import { Client, Events } from "discord.js";
import { AppContext } from "../../services/AppContext";
import { commands } from "../commands";
import { buildErrorEmbed } from "../embeds/error.embed";
import { logger } from "../../utils/logger";

export const registerInteractionCreateEvent = (client: Client, context: AppContext) => {
  const commandMap = new Map(commands.map((command) => [command.data.name, command]));

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, context);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected error";
      logger.warn("Command failed", {
        command: interaction.commandName,
        user: interaction.user.id,
        error: message
      });

      const payload = { embeds: [buildErrorEmbed(message, interaction.user)] };
      try {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(payload);
        } else {
          await interaction.reply(payload);
        }
      } catch (replyError) {
        logger.warn("Could not send command error response", {
          command: interaction.commandName,
          user: interaction.user.id,
          error: replyError instanceof Error ? replyError.message : String(replyError)
        });
      }
    }
  });
};
