import { Client, REST, Routes } from "discord.js";
import { env } from "../../config/env";
import { commands } from "../commands";
import { logger } from "../../utils/logger";

export const registerReadyEvent = (client: Client) => {
  client.once("ready", async () => {
    const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
    const route = env.DISCORD_GUILD_ID
      ? Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID)
      : Routes.applicationCommands(env.DISCORD_CLIENT_ID);

    await rest.put(route, {
      body: commands.map((command) => command.data.toJSON())
    });
    logger.info("Discord bot ready", {
      user: client.user?.tag,
      commands: commands.length,
      commandScope: env.DISCORD_GUILD_ID ? `guild:${env.DISCORD_GUILD_ID}` : "global"
    });
  });
};
