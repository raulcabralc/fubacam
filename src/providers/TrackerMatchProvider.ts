import { env } from "../config/env";
import { MatchProvider } from "./MatchProvider";
import { ProviderMatch, ProviderPlayerValidation, RegisteredPlayer } from "../types/match.types";
import { TrackerMatchesResponseSchema, TrackerMatchPayload } from "../types/tracker.types";
import { logger } from "../utils/logger";

export class TrackerMatchProvider implements MatchProvider {
  getName() {
    return "tracker";
  }

  async validatePlayer(riotName: string, tagLine: string): Promise<ProviderPlayerValidation> {
    if (!env.TRACKER_API_KEY) {
      return { valid: false, reason: "TRACKER_API_KEY is not configured" };
    }

    try {
      const encoded = encodeURIComponent(`${riotName}#${tagLine}`);
      const data = await this.requestJson(`/api/v2/valorant/standard/profile/riot/${encoded}`);
      const metadata = getRecord(data, "data", "platformInfo");
      return {
        valid: true,
        providerPlayerId: getString(metadata, "platformUserIdentifier") ?? `${riotName}#${tagLine}`,
        displayName: getString(metadata, "platformUserHandle") ?? `${riotName}#${tagLine}`
      };
    } catch (error) {
      logger.warn("Tracker player validation failed", {
        riotName,
        tagLine,
        error: error instanceof Error ? error.message : String(error)
      });
      return { valid: false, reason: "Tracker API did not validate this Riot account" };
    }
  }

  async getRecentMatches(player: RegisteredPlayer): Promise<ProviderMatch[]> {
    if (!env.TRACKER_API_KEY) {
      throw new Error("TRACKER_API_KEY is not configured");
    }

    const encoded = encodeURIComponent(`${player.riotName}#${player.tagLine}`);
    const endpoint = `/api/v2/valorant/standard/matches/riot/${encoded}`;
    const payload = await this.requestJson(endpoint);
    const parsed = TrackerMatchesResponseSchema.safeParse(payload);

    if (!parsed.success) {
      logger.warn("Tracker matches payload did not match expected schema", {
        player: `${player.riotName}#${player.tagLine}`,
        issues: parsed.error.issues
      });
      return [];
    }

    return parsed.data.data
      .map((match) => this.toProviderMatch(match, player))
      .filter((match): match is ProviderMatch => Boolean(match));
  }

  private async requestJson(path: string): Promise<unknown> {
    const url = new URL(path, env.TRACKER_API_BASE_URL);
    const response = await fetch(url, {
      headers: {
        "TRN-Api-Key": env.TRACKER_API_KEY,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error(
          [
            "Tracker API returned HTTP 401.",
            "Check if TRACKER_API_KEY is valid, whitelisted, and authorized for this endpoint.",
            "Tracker's public docs may not currently expose Valorant match-history endpoints."
          ].join(" ")
        );
      }

      throw new Error(`Tracker API returned HTTP ${response.status} for ${url.pathname}`);
    }

    return response.json();
  }

  private toProviderMatch(match: TrackerMatchPayload, player: RegisteredPlayer): ProviderMatch | null {
    const metadata = match.metadata ?? {};
    const attributes = match.attributes ?? {};
    const overview = match.segments?.find((segment) => segment.type === "overview") ?? match.segments?.[0];
    const stats = overview?.stats ?? {};

    const matchId = firstString(
      metadata.matchId,
      metadata.id,
      attributes.id,
      attributes.matchId,
      getNestedValue(match, ["metadata", "matchId"])
    );

    if (!matchId) {
      logger.warn("Tracker match skipped because no match id was found", {
        player: `${player.riotName}#${player.tagLine}`
      });
      return null;
    }

    return {
      provider: this.getName(),
      providerMatchId: matchId,
      startedAt: parseDate(firstString(metadata.timestamp, metadata.date, attributes.timestamp)) ?? new Date(),
      map: firstString(metadata.mapName, metadata.map, attributes.map),
      mode: firstString(metadata.modeName, metadata.mode, attributes.mode),
      queue: firstString(metadata.queueName, metadata.queue, attributes.queue),
      teamScore: firstNumber(metadata.teamScore, attributes.teamScore, readStat(stats, "teamScore")),
      enemyScore: firstNumber(metadata.enemyScore, attributes.enemyScore, readStat(stats, "enemyScore")),
      durationSeconds: firstNumber(metadata.duration, metadata.durationSeconds, attributes.duration),
      playerStats: {
        riotName: player.riotName,
        tagLine: player.tagLine,
        agent: firstString(metadata.agentName, attributes.agentName, getRecord(overview?.metadata, "agentName")),
        kills: firstNumber(readStat(stats, "kills")),
        deaths: firstNumber(readStat(stats, "deaths")),
        assists: firstNumber(readStat(stats, "assists")),
        score: firstNumber(readStat(stats, "score")),
        combatScore: firstNumber(readStat(stats, "combatScore"), readStat(stats, "averageCombatScore")),
        won: firstBoolean(metadata.won, attributes.won, readStat(stats, "won"))
      },
      raw: match
    };
  }
}

const getRecord = (value: unknown, ...path: string[]): Record<string, unknown> | undefined => {
  let current: unknown = value;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current && typeof current === "object" ? (current as Record<string, unknown>) : undefined;
};

const getString = (value: unknown, key: string) => {
  if (!value || typeof value !== "object") return undefined;
  const candidate = (value as Record<string, unknown>)[key];
  return typeof candidate === "string" ? candidate : undefined;
};

const getNestedValue = (value: unknown, path: string[]) => {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

const readStat = (stats: Record<string, unknown>, key: string) => {
  const value = stats[key];
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  return record.value ?? record.displayValue;
};

const firstString = (...values: unknown[]) => values.find((value): value is string => typeof value === "string" && value.length > 0);
const firstNumber = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return Number(value);
  }
  return undefined;
};
const firstBoolean = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string" && ["true", "won", "win"].includes(value.toLowerCase())) return true;
    if (typeof value === "string" && ["false", "lost", "loss"].includes(value.toLowerCase())) return false;
  }
  return undefined;
};
const parseDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
