import { BotCommand } from "./Command";
import { lastMatchCommand } from "./lastmatch.command";
import { leaderboardCommand } from "./leaderboard.command";
import { matchCommand } from "./match.command";
import { matchDetailsCommand } from "./match-details.command";
import { playersCommand } from "./players.command";
import { rankingCommand } from "./ranking.command";
import { registerCommand } from "./register.command";
import { setChannelCommand } from "./set-channel.command";
import { simulateMatchCommand } from "./simulate-match.command";
import { streakCommand } from "./streak.command";
import { trackingStatusCommand } from "./tracking-status.command";
import { unregisterCommand } from "./unregister.command";

export const commands: BotCommand[] = [
  registerCommand,
  unregisterCommand,
  setChannelCommand,
  playersCommand,
  leaderboardCommand,
  lastMatchCommand,
  matchCommand,
  matchDetailsCommand,
  rankingCommand,
  simulateMatchCommand,
  streakCommand,
  trackingStatusCommand
];
