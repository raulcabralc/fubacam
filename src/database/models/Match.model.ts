import { Schema, model } from "mongoose";

export type MatchDocument = {
  guildId: string;
  provider: string;
  providerMatchId: string;
  playerDiscordUserId: string;
  riotName: string;
  tagLine: string;
  startedAt: Date;
  map?: string;
  mode?: string;
  queue?: string;
  teamScore?: number;
  enemyScore?: number;
  durationSeconds?: number;
  agent?: string;
  kills?: number;
  deaths?: number;
  assists?: number;
  score?: number;
  combatScore?: number;
  won?: boolean;
  raw?: unknown;
  postedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const MatchSchema = new Schema<MatchDocument>(
  {
    guildId: { type: String, required: true, index: true },
    provider: { type: String, required: true },
    providerMatchId: { type: String, required: true },
    playerDiscordUserId: { type: String, required: true, index: true },
    riotName: { type: String, required: true },
    tagLine: { type: String, required: true },
    startedAt: { type: Date, required: true, index: true },
    map: { type: String },
    mode: { type: String },
    queue: { type: String },
    teamScore: { type: Number },
    enemyScore: { type: Number },
    durationSeconds: { type: Number },
    agent: { type: String },
    kills: { type: Number },
    deaths: { type: Number },
    assists: { type: Number },
    score: { type: Number },
    combatScore: { type: Number },
    won: { type: Boolean },
    raw: { type: Schema.Types.Mixed },
    postedAt: { type: Date }
  },
  { timestamps: true }
);

MatchSchema.index({ guildId: 1, provider: 1, providerMatchId: 1 }, { unique: true });

export const MatchModel = model<MatchDocument>("Match", MatchSchema);
