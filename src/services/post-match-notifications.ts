import { MessageCreateOptions } from "discord.js";
import { MatchDocument } from "../database/models/Match.model";

export const FUBALICIOUS_ROLE_ID = "1470256656192376976";

export type PostMatchNotificationContext = {
  match: MatchDocument;
  playerMention: string;
  roleMention: string;
};

export type PostMatchNotification = {
  key: string;
  name: string;
  description: string;
  shouldSend: (context: PostMatchNotificationContext) => boolean;
  buildMessage: (context: PostMatchNotificationContext) => MessageCreateOptions;
};

export const postMatchNotifications: PostMatchNotification[] = [
  {
    key: "rank-drop",
    name: "Rank drop",
    description:
      "Sends a follow-up message when a player drops to a lower rank after the match.",
    shouldSend: ({ match }) => isRankDrop(match),
    buildMessage: ({ match, playerMention, roleMention }) => ({
      content: `${roleMention} ${playerMention} just dropped to ${match.rank}!`,
      allowedMentions: {
        roles: [FUBALICIOUS_ROLE_ID],
        users: [match.playerDiscordUserId],
      },
    }),
  },
  {
    key: "stinker-match",
    name: "Stinker match",
    description:
      "Sends a follow-up message when a player has a brutal match by FB/FD, kill differential, or ACS.",
    shouldSend: ({ match }) => isStinkerMatch(match),
    buildMessage: ({ match, playerMention, roleMention }) => ({
      content: `${roleMention} ${playerMention} has dropped a stinker performance!`,
      allowedMentions: {
        roles: [FUBALICIOUS_ROLE_ID],
        users: [match.playerDiscordUserId],
      },
    }),
  },
];

export const getPostMatchNotifications = (match: MatchDocument) => {
  const context = {
    match,
    playerMention: `<@${match.playerDiscordUserId}>`,
    roleMention: `<@&${FUBALICIOUS_ROLE_ID}>`,
  };

  return postMatchNotifications
    .filter((notification) => notification.shouldSend(context))
    .map((notification) => notification.buildMessage(context));
};

export const isRankDrop = (
  match: Pick<
    MatchDocument,
    "rank" | "rankTierId" | "previousRank" | "previousRankTierId"
  >,
) => {
  const current = match.rankTierId ?? getRankOrder(match.rank);
  const previous = match.previousRankTierId ?? getRankOrder(match.previousRank);
  return current !== undefined && previous !== undefined && current < previous;
};

export const isStinkerMatch = (
  match: Pick<
    MatchDocument,
    "firstBloods" | "firstDeaths" | "kills" | "deaths" | "combatScore"
  >,
) => {
  const openingDuelDiff = (match.firstBloods ?? 0) - (match.firstDeaths ?? 0);
  const killDiff = (match.kills ?? 0) - (match.deaths ?? 0);
  const acs = match.combatScore;

  return (
    openingDuelDiff <= -5 || killDiff <= -10 || (acs !== undefined && acs < 100)
  );
};

const getRankOrder = (rank?: string) => {
  if (!rank) return undefined;
  const normalized = rank.trim().toLowerCase();
  if (normalized === "unrated") return 0;
  if (normalized === "radiant") return 25;

  const match = normalized.match(
    /^(iron|bronze|silver|gold|platinum|diamond|ascendant|immortal)\s+([1-3])$/,
  );
  if (!match) return undefined;

  const baseByRank: Record<string, number> = {
    iron: 1,
    bronze: 4,
    silver: 7,
    gold: 10,
    platinum: 13,
    diamond: 16,
    ascendant: 19,
    immortal: 22,
  };

  return baseByRank[match[1]] + Number(match[2]) - 1;
};
