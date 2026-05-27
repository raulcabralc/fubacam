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

const AbilityCastsSchema = z.object({
  grenadeCasts: z.number(),
  ability1Casts: z.number(),
  ability2Casts: z.number(),
  ultimateCasts: z.number()
});

const PlayerStatsSchema = z.object({
  score: z.number(),
  roundsPlayed: z.number(),
  kills: z.number(),
  deaths: z.number(),
  assists: z.number(),
  playtimeMillis: z.number(),
  abilityCasts: AbilityCastsSchema.nullish()
});

const PlayerSchema = z.object({
  puuid: z.string(),
  gameName: z.string(),
  tagLine: z.string(),
  teamId: z.string(),
  partyId: z.string().optional(),
  characterId: z.string(),
  stats: PlayerStatsSchema.nullish(),
  competitiveTier: z.number().optional(),
  isObserver: z.boolean().optional(),
  playerCard: z.string().optional(),
  playerTitle: z.string().optional(),
  accountLevel: z.number().optional()
});

const TeamSchema = z.object({
  teamId: z.string(),
  won: z.boolean(),
  roundsPlayed: z.number(),
  roundsWon: z.number(),
  numPoints: z.number().optional()
});

const DamageSchema = z.object({
  receiver: z.string(),
  damage: z.number(),
  legshots: z.number(),
  bodyshots: z.number(),
  headshots: z.number()
});

const EconomySchema = z.object({
  loadoutValue: z.number(),
  weapon: z.string(),
  armor: z.string(),
  remaining: z.number(),
  spent: z.number()
});

const AbilitySchema = z.object({
  grenadeEffects: z.string().optional(),
  ability1Effects: z.string().optional(),
  ability2Effects: z.string().optional(),
  ultimateEffects: z.string().optional()
});

const KillSchema = z.object({
  timeSinceGameStartMillis: z.number(),
  timeSinceRoundStartMillis: z.number(),
  killer: z.string(),
  victim: z.string(),
  assistants: z.array(z.string()).nullish(),
  finishingDamage: z
    .object({
      damageType: z.string(),
      damageItem: z.string(),
      isSecondaryFireMode: z.boolean()
    })
    .optional()
});

const PlayerRoundStatsSchema = z.object({
  puuid: z.string(),
  kills: z.array(KillSchema).default([]),
  damage: z.array(DamageSchema).default([]),
  score: z.number(),
  economy: EconomySchema,
  ability: AbilitySchema.optional()
});

const RoundResultSchema = z.object({
  roundNum: z.number(),
  roundResult: z.string(),
  roundCeremony: z.string(),
  winningTeam: z.string(),
  bombPlanter: z.string().nullish(),
  bombDefuser: z.string().nullish(),
  plantRoundTime: z.number().nullish(),
  plantSite: z.string().nullish(),
  defuseRoundTime: z.number().nullish(),
  playerStats: z.array(PlayerRoundStatsSchema).default([]),
  roundResultCode: z.string()
});

export const RiotMatchSchema = z.object({
  matchInfo: z.object({
    matchId: z.string(),
    mapId: z.string(),
    gameLengthMillis: z.number(),
    gameStartMillis: z.number(),
    provisioningFlowId: z.string().optional(),
    isCompleted: z.boolean().optional(),
    customGameName: z.string().optional(),
    queueId: z.string().optional(),
    gameMode: z.string(),
    isRanked: z.boolean().optional(),
    seasonId: z.string().optional()
  }),
  players: z.array(PlayerSchema).default([]),
  coaches: z.array(z.unknown()).default([]),
  teams: z.array(TeamSchema).default([]),
  roundResults: z.array(RoundResultSchema).default([])
});

export type RiotMatchPayload = z.infer<typeof RiotMatchSchema>;
