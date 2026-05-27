import { z } from "zod";

export const RiotAccountSchema = z.object({
  puuid: z.string(),
  gameName: z.string().optional(),
  tagLine: z.string().optional()
});

export const RiotTokenResponseSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string().optional(),
  expires_in: z.number().optional(),
  token_type: z.string().optional()
});

export const RiotMatchListSchema = z.object({
  history: z
    .array(
      z.object({
        matchId: z.string(),
        gameStartTimeMillis: z.number().optional(),
        queueId: z.string().optional()
      })
    )
    .default([])
});

export const RiotMatchSchema = z.object({
  metadata: z.object({
    matchId: z.string(),
    mapId: z.string().optional(),
    gameLengthMillis: z.number().optional(),
    gameStartMillis: z.number().optional(),
    gameMode: z.string().optional()
  }),
  players: z
    .array(
      z.object({
        puuid: z.string(),
        gameName: z.string().optional(),
        tagLine: z.string().optional(),
        teamId: z.string().optional(),
        characterId: z.string().optional(),
        stats: z
          .object({
            score: z.number().optional(),
            kills: z.number().optional(),
            deaths: z.number().optional(),
            assists: z.number().optional()
          })
          .optional()
      })
    )
    .default([]),
  teams: z
    .array(
      z.object({
        teamId: z.string(),
        won: z.boolean().optional(),
        roundsWon: z.number().optional(),
        roundsPlayed: z.number().optional()
      })
    )
    .optional()
});

export type RiotMatchPayload = z.infer<typeof RiotMatchSchema>;
