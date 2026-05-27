import { Schema, model } from "mongoose";

export type RiotLinkStateDocument = {
  state: string;
  guildId: string;
  discordUserId: string;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const RiotLinkStateSchema = new Schema<RiotLinkStateDocument>(
  {
    state: { type: String, required: true, unique: true, index: true },
    guildId: { type: String, required: true, index: true },
    discordUserId: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true, expires: 0 },
    usedAt: { type: Date }
  },
  { timestamps: true }
);

export const RiotLinkStateModel = model<RiotLinkStateDocument>("RiotLinkState", RiotLinkStateSchema);
