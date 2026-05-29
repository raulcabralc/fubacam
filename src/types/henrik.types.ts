import { z } from "zod";

const StringLikeSchema = z
  .union([z.string(), z.record(z.unknown())])
  .nullish()
  .transform((value) => value ?? undefined);
const OptionalNumberSchema = z
  .number()
  .nullish()
  .transform((value) => value ?? undefined);

const HenrikPlayerSchema = z
  .object({
    puuid: z.string().optional(),
    name: z.string().optional(),
    tag: z.string().optional(),
    team: z.string().optional(),
    team_id: z.string().optional(),
    character: z.string().optional(),
    agent: StringLikeSchema,
    session_playtime_in_ms: OptionalNumberSchema,
    session_playtime: z
      .object({
        milliseconds: OptionalNumberSchema
      })
      .optional(),
    ability_casts: z
      .object({
        c_cast: OptionalNumberSchema,
        q_cast: OptionalNumberSchema,
        e_cast: OptionalNumberSchema,
        x_cast: OptionalNumberSchema,
        grenade: OptionalNumberSchema,
        ability1: OptionalNumberSchema,
        ability2: OptionalNumberSchema,
        ability_1: OptionalNumberSchema,
        ability_2: OptionalNumberSchema,
        ultimate: OptionalNumberSchema
      })
      .nullish()
      .transform((value) => value ?? undefined),
    stats: z
      .object({
        score: OptionalNumberSchema,
        kills: OptionalNumberSchema,
        deaths: OptionalNumberSchema,
        assists: OptionalNumberSchema,
        bodyshots: OptionalNumberSchema,
        headshots: OptionalNumberSchema,
        legshots: OptionalNumberSchema,
        damage: z
          .object({
            dealt: OptionalNumberSchema,
            received: OptionalNumberSchema
          })
          .optional()
      })
      .optional(),
    economy: z
      .object({
        spent: z
          .object({
            overall: OptionalNumberSchema,
            average: OptionalNumberSchema
          })
          .optional(),
        loadout_value: z
          .object({
            overall: OptionalNumberSchema,
            average: OptionalNumberSchema
          })
          .optional()
      })
      .optional(),
    damage_made: OptionalNumberSchema,
    damage_received: OptionalNumberSchema
  })
  .passthrough();

const HenrikTeamSchema = z
  .object({
    team_id: z.string().optional(),
    teamId: z.string().optional(),
    team: z.string().optional(),
    has_won: z.boolean().optional(),
    won: z.boolean().optional(),
    rounds_won: OptionalNumberSchema,
    rounds_lost: OptionalNumberSchema,
    rounds: z
      .object({
        won: OptionalNumberSchema,
        lost: OptionalNumberSchema
      })
      .optional()
  })
  .passthrough();

export const HenrikMatchSchema = z
  .object({
    metadata: z
      .object({
        match_id: z.string().optional(),
        map: StringLikeSchema,
        game_length: OptionalNumberSchema,
        game_length_in_ms: OptionalNumberSchema,
        game_start: OptionalNumberSchema,
        started_at: z.string().optional(),
        rounds_played: OptionalNumberSchema,
        mode: z.string().optional(),
        mode_id: z.string().optional(),
        queue: StringLikeSchema,
        matchid: z.string().optional(),
        region: z.string().optional()
      })
      .passthrough(),
    players: z.union([
      z
        .object({
          all_players: z.array(HenrikPlayerSchema).default([])
        })
        .passthrough(),
      z.array(HenrikPlayerSchema)
    ]),
    teams: z
      .union([
        z
          .object({
            red: HenrikTeamSchema.optional(),
            blue: HenrikTeamSchema.optional()
          })
          .passthrough(),
        z.array(HenrikTeamSchema)
      ])
      .optional(),
    rounds: z.array(z.record(z.unknown())).default([])
  })
  .passthrough();

export const HenrikMatchesResponseSchema = z.object({
  status: z.number(),
  data: z.array(HenrikMatchSchema).default([])
});

export const HenrikMmrResponseSchema = z.object({
  status: z.number(),
  data: z
    .object({
      account: z
        .object({
          name: z.string().optional(),
          tag: z.string().optional()
        })
        .optional(),
      current: z
        .object({
          tier: z
            .object({
              id: OptionalNumberSchema,
              name: z.string().optional()
            })
            .optional(),
          rr: OptionalNumberSchema,
          last_change: OptionalNumberSchema,
          elo: OptionalNumberSchema,
          leaderboard_placement: z
            .object({
              rank: OptionalNumberSchema
            })
            .nullish()
            .transform((value) => value ?? undefined)
        })
        .optional()
    })
    .optional()
});

export const HenrikMmrHistoryResponseSchema = z.object({
  status: z.number(),
  data: z
    .object({
      account: z
        .object({
          puuid: z.string().optional(),
          name: z.string().optional(),
          tag: z.string().optional()
        })
        .optional(),
      history: z
        .array(
          z
            .object({
              match_id: z.string().optional(),
              tier: z
                .object({
                  id: OptionalNumberSchema,
                  name: z.string().optional()
                })
                .optional(),
              rr: OptionalNumberSchema,
              last_change: OptionalNumberSchema,
              elo: OptionalNumberSchema,
              date: z.string().optional()
            })
            .passthrough()
        )
        .default([])
    })
    .optional()
});

export type HenrikMatchPayload = z.infer<typeof HenrikMatchSchema>;
export type HenrikPlayerPayload = z.infer<typeof HenrikPlayerSchema>;
export type HenrikMmrPayload = z.infer<typeof HenrikMmrResponseSchema>;
export type HenrikMmrHistoryPayload = z.infer<typeof HenrikMmrHistoryResponseSchema>;
