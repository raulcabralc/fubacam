import { MatchProvider } from "./MatchProvider";
import { ProviderMatch, ProviderPlayerValidation, RegisteredPlayer } from "../types/match.types";

export class MockMatchProvider implements MatchProvider {
  getName() {
    return "mock";
  }

  async validatePlayer(riotName: string, tagLine: string): Promise<ProviderPlayerValidation> {
    return {
      valid: true,
      providerPlayerId: `${riotName}#${tagLine}`,
      displayName: `${riotName}#${tagLine}`
    };
  }

  async getRecentMatches(_player: RegisteredPlayer): Promise<ProviderMatch[]> {
    return [];
  }

  createFakeMatch(player: RegisteredPlayer): ProviderMatch {
    const won = Math.random() > 0.45;
    const kills = randomBetween(8, 28);
    const deaths = randomBetween(6, 22);
    const assists = randomBetween(1, 14);

    return {
      provider: this.getName(),
      providerMatchId: `mock-${player.guildId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      startedAt: new Date(),
      map: pick(["Ascent", "Bind", "Haven", "Lotus", "Split", "Sunset"]),
      mode: "Competitive",
      queue: "competitive",
      teamScore: won ? 13 : randomBetween(4, 11),
      enemyScore: won ? randomBetween(4, 11) : 13,
      durationSeconds: randomBetween(1800, 3100),
      playerStats: {
        riotName: player.riotName,
        tagLine: player.tagLine,
        agent: pick(["Jett", "Raze", "Omen", "Sova", "Killjoy", "Clove"]),
        kills,
        deaths,
        assists,
        score: kills * 200 + assists * 55,
        combatScore: randomBetween(120, 360),
        won,
        firstBloods: randomBetween(0, 4),
        firstDeaths: randomBetween(0, 3)
      },
      raw: { generated: true }
    };
  }
}

const pick = <T>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const randomBetween = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
