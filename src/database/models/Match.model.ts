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
  firstBloods?: number;
  firstDeaths?: number;
  roundsPlayed?: number;
  playtimeMillis?: number;
  totalDamage?: number;
  headshots?: number;
  bodyshots?: number;
  legshots?: number;
  headshotPercent?: number;
  bodyshotPercent?: number;
  legshotPercent?: number;
  plants?: number;
  defuses?: number;
  avgLoadoutValue?: number;
  totalSpent?: number;
  totalRemaining?: number;
  grenadeCasts?: number;
  ability1Casts?: number;
  ability2Casts?: number;
  ultimateCasts?: number;
  multiKills?: number;
  aces?: number;
  maxKillsInRound?: number;
  rank?: string;
  rankTierId?: number;
  rr?: number;
  rrChange?: number;
  elo?: number;
  rankChanged?: boolean;
  previousRank?: string;
  previousRankTierId?: number;
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
    firstBloods: { type: Number },
    firstDeaths: { type: Number },
    roundsPlayed: { type: Number },
    playtimeMillis: { type: Number },
    totalDamage: { type: Number },
    headshots: { type: Number },
    bodyshots: { type: Number },
    legshots: { type: Number },
    headshotPercent: { type: Number },
    bodyshotPercent: { type: Number },
    legshotPercent: { type: Number },
    plants: { type: Number },
    defuses: { type: Number },
    avgLoadoutValue: { type: Number },
    totalSpent: { type: Number },
    totalRemaining: { type: Number },
    grenadeCasts: { type: Number },
    ability1Casts: { type: Number },
    ability2Casts: { type: Number },
    ultimateCasts: { type: Number },
    multiKills: { type: Number },
    aces: { type: Number },
    maxKillsInRound: { type: Number },
    rank: { type: String },
    rankTierId: { type: Number },
    rr: { type: Number },
    rrChange: { type: Number },
    elo: { type: Number },
    rankChanged: { type: Boolean },
    previousRank: { type: String },
    previousRankTierId: { type: Number },
    raw: { type: Schema.Types.Mixed },
    postedAt: { type: Date }
  },
  { timestamps: true }
);

MatchSchema.index({ guildId: 1, provider: 1, providerMatchId: 1, playerDiscordUserId: 1 }, { unique: true });

export const MatchModel = model<MatchDocument>("Match", MatchSchema);
