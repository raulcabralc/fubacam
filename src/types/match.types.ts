export type MatchProviderName = "tracker" | "mock" | "riot" | "henrik";

export type RegisteredPlayer = {
  id: string;
  guildId: string;
  discordUserId: string;
  riotName: string;
  tagLine: string;
  providerPlayerId?: string;
  riotPuuid?: string;
};

export type ProviderPlayerValidation = {
  valid: boolean;
  providerPlayerId?: string;
  displayName?: string;
  reason?: string;
};

export type ProviderMatchPlayerStats = {
  riotName: string;
  tagLine: string;
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
  maxKilllessRoundStreak?: number;
  rank?: string;
  rankTierId?: number;
  rr?: number;
  rrChange?: number;
  elo?: number;
  rankChanged?: boolean;
  previousRank?: string;
  previousRankTierId?: number;
};

export type ProviderMatch = {
  provider: string;
  providerMatchId: string;
  startedAt: Date;
  map?: string;
  mode?: string;
  queue?: string;
  teamScore?: number;
  enemyScore?: number;
  durationSeconds?: number;
  playerStats: ProviderMatchPlayerStats;
  raw?: unknown;
};

export type StoredMatchSummary = ProviderMatch & {
  guildId: string;
  playerDiscordUserId: string;
  postedAt?: Date;
};
