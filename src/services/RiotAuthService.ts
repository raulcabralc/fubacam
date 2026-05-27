import crypto from "node:crypto";
import { env } from "../config/env";
import { RiotLinkStateModel } from "../database/models/RiotLinkState.model";
import { PlayerService } from "./PlayerService";
import { RiotAccountSchema, RiotTokenResponseSchema } from "../types/riot.types";

export class RiotAuthService {
  constructor(private readonly playerService: PlayerService) {}

  async createAuthorizationUrl(input: { guildId: string; discordUserId: string }) {
    if (!env.RIOT_CLIENT_ID || !env.RIOT_REDIRECT_URI) {
      throw new Error("Riot OAuth is not configured.");
    }

    const state = crypto.randomBytes(32).toString("hex");
    await RiotLinkStateModel.create({
      state,
      guildId: input.guildId,
      discordUserId: input.discordUserId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    const url = new URL("https://auth.riotgames.com/authorize");
    url.searchParams.set("client_id", env.RIOT_CLIENT_ID);
    url.searchParams.set("redirect_uri", env.RIOT_REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid offline_access");
    url.searchParams.set("state", state);

    return url.toString();
  }

  async completeAuthorization(input: { code: string; state: string }) {
    const state = await RiotLinkStateModel.findOne({
      state: input.state,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() }
    });

    if (!state) {
      throw new Error("This Riot link request is invalid or expired.");
    }

    const token = await this.exchangeCode(input.code);
    const account = await this.getAccount(token.access_token);

    const player = await this.playerService.linkRiotAccount({
      guildId: state.guildId,
      discordUserId: state.discordUserId,
      riotName: account.gameName ?? "Unknown",
      tagLine: account.tagLine ?? "Unknown",
      riotPuuid: account.puuid
    });

    state.usedAt = new Date();
    await state.save();

    return player;
  }

  private async exchangeCode(code: string) {
    if (!env.RIOT_CLIENT_ID || !env.RIOT_CLIENT_SECRET || !env.RIOT_REDIRECT_URI) {
      throw new Error("Riot OAuth is not configured.");
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: env.RIOT_REDIRECT_URI
    });

    const credentials = Buffer.from(`${env.RIOT_CLIENT_ID}:${env.RIOT_CLIENT_SECRET}`).toString("base64");
    const response = await fetch("https://auth.riotgames.com/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json"
      },
      body
    });

    if (!response.ok) {
      throw new Error(`Riot OAuth token exchange failed with HTTP ${response.status}`);
    }

    return RiotTokenResponseSchema.parse(await response.json());
  }

  private async getAccount(accessToken: string) {
    const response = await fetch(`https://${env.RIOT_API_REGION}.api.riotgames.com/riot/account/v1/accounts/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Riot account lookup failed with HTTP ${response.status}`);
    }

    return RiotAccountSchema.parse(await response.json());
  }
}
