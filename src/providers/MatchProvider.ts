import {
  ProviderMatch,
  ProviderPlayerValidation,
  RegisteredPlayer
} from "../types/match.types";

export interface MatchProvider {
  getName(): string;
  getRecentMatches(player: RegisteredPlayer): Promise<ProviderMatch[]>;
  validatePlayer?(riotName: string, tagLine: string): Promise<ProviderPlayerValidation>;
}
