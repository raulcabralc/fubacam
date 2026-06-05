import { Client, GatewayIntentBits, Options } from "discord.js";

export const createDiscordClient = () =>
  new Client({
    intents: [GatewayIntentBits.Guilds],
    makeCache: Options.cacheWithLimits({
      MessageManager: 0,
      ReactionManager: 0,
      GuildMemberManager: 0,
      UserManager: 25,
      GuildBanManager: 0,
      GuildInviteManager: 0,
      GuildScheduledEventManager: 0,
      PresenceManager: 0,
      StageInstanceManager: 0,
      ThreadManager: 0,
      ThreadMemberManager: 0,
      VoiceStateManager: 0
    }),
    sweepers: {
      messages: {
        interval: 300,
        lifetime: 300
      },
      users: {
        interval: 300,
        filter: () => (user) => user.bot
      }
    }
  });
