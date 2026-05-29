import { Client, Events, REST, Routes } from "discord.js";
import { env } from "../../config/env";
import { commands } from "../commands";
import { logger } from "../../utils/logger";

export const registerReadyEvent = (client: Client) => {
  client.once(Events.ClientReady, async () => {
    const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
    const route = env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
      : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

    try {
      if (env.DISCORD_GUILD_ID) {
        await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
          body: []
        });
        logger.info("Cleared global Discord slash commands while using guild command scope");
      }

      await rest.put(route, {
        body: commands.map((command) => command.data.toJSON())
      });
    } catch (error) {
      logger.error("Could not register Discord slash commands", {
        commandScope: env.DISCORD_GUILD_ID ? `guild:${env.DISCORD_GUILD_ID}` : "global",
        error: error instanceof Error ? error.message : String(error),
        hint: env.DISCORD_GUILD_ID
          ? "Check if the bot is in this guild and was invited with the applications.commands scope."
          : "Check the Discord client id/token and applications.commands scope."
      });
      return;
    }

    logger.info("Discord bot ready", {
      user: client.user?.tag,
      commands: commands.length,
      commandScope: env.DISCORD_GUILD_ID ? `guild:${env.DISCORD_GUILD_ID}` : "global"
    });
  });
};
