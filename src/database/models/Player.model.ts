import { Schema, model } from "mongoose";

export type PlayerDocument = {
  guildId: string;
  discordUserId: string;
  riotName: string;
  tagLine: string;
  providerPlayerId?: string;
  riotPuuid?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

const PlayerSchema = new Schema<PlayerDocument>(
  {
    guildId: { type: String, required: true, index: true },
    discordUserId: { type: String, required: true, index: true },
    riotName: { type: String, required: true },
    tagLine: { type: String, required: true },
    providerPlayerId: { type: String },
    riotPuuid: { type: String, index: true },
    active: { type: Boolean, required: true, default: true }
  },
  { timestamps: true }
);

PlayerSchema.index({ guildId: 1, discordUserId: 1 }, { unique: true });
PlayerSchema.index({ guildId: 1, riotName: 1, tagLine: 1 }, { unique: true });

export const PlayerModel = model<PlayerDocument>("Player", PlayerSchema);
