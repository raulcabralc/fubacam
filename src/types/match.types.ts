export type MatchProviderName = "tracker" | "mock" | "riot";

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
