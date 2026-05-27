import { BotCommand } from "./Command";
import { lastMatchCommand } from "./lastmatch.command";
import { linkRiotCommand } from "./link-riot.command";
import { mockMatchCommand } from "./mock-match.command";
import { playersCommand } from "./players.command";
import { rankingCommand } from "./ranking.command";
import { registerCommand } from "./register.command";
import { setChannelCommand } from "./set-channel.command";
import { trackingStatusCommand } from "./tracking-status.command";
import { unregisterCommand } from "./unregister.command";

export const commands: BotCommand[] = [
  registerCommand,
  unregisterCommand,
  setChannelCommand,
  linkRiotCommand,
  playersCommand,
  lastMatchCommand,
  rankingCommand,
  mockMatchCommand,
  trackingStatusCommand
];
