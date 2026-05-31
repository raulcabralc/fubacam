import { PlayerModel } from "../database/models/Player.model";
import { MatchProvider } from "../providers/MatchProvider";
import { RegisteredPlayer } from "../types/match.types";

export class PlayerService {
  constructor(private readonly provider: MatchProvider) {}

  async register(input: {
    guildId: string;
    discordUserId: string;
    riotName: string;
    tagLine: string;
  }) {
    const validation = this.provider.validatePlayer
      ? await this.provider.validatePlayer(input.riotName, input.tagLine)
      : { valid: true };

    if (!validation.valid) {
      throw new Error(validation.reason ?? "Could not validate Riot account");
    }

    return PlayerModel.findOneAndUpdate(
      { guildId: input.guildId, discordUserId: input.discordUserId },
      {
        ...input,
        providerPlayerId: validation.providerPlayerId,
        active: true,
        trackingStartedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async unregister(guildId: string, discordUserId: string) {
    return PlayerModel.findOneAndUpdate({ guildId, discordUserId }, { active: false }, { new: true });
  }

  async listByGuild(guildId: string) {
    return PlayerModel.find({ guildId, active: true }).sort({ riotName: 1, tagLine: 1 });
  }

  async findByDiscordUser(guildId: string, discordUserId: string) {
    return PlayerModel.findOne({ guildId, discordUserId, active: true });
  }

  async linkRiotAccount(input: {
    guildId: string;
    discordUserId: string;
    riotName: string;
    tagLine: string;
    riotPuuid: string;
  }) {
    return PlayerModel.findOneAndUpdate(
      { guildId: input.guildId, discordUserId: input.discordUserId },
      {
        guildId: input.guildId,
        discordUserId: input.discordUserId,
        riotName: input.riotName,
        tagLine: input.tagLine,
        riotPuuid: input.riotPuuid,
        providerPlayerId: input.riotPuuid,
        active: true,
        trackingStartedAt: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  toRegisteredPlayer(player: {
    id?: string;
    _id?: unknown;
    guildId: string;
    discordUserId: string;
    riotName: string;
    tagLine: string;
    providerPlayerId?: string;
    riotPuuid?: string;
  }): RegisteredPlayer {
    return {
      id: String(player.id ?? player._id),
      guildId: player.guildId,
      discordUserId: player.discordUserId,
      riotName: player.riotName,
      tagLine: player.tagLine,
      providerPlayerId: player.providerPlayerId,
      riotPuuid: player.riotPuuid
    };
  }
}
