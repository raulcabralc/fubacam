import { Schema, model } from "mongoose";

export type GuildSettingsDocument = {
  guildId: string;
  summaryChannelId?: string;
  trackingEnabled: boolean;
  lastTrackingCheckAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

const GuildSettingsSchema = new Schema<GuildSettingsDocument>(
  {
    guildId: { type: String, required: true, unique: true, index: true },
    summaryChannelId: { type: String },
    trackingEnabled: { type: Boolean, required: true, default: true },
    lastTrackingCheckAt: { type: Date }
  },
  { timestamps: true }
);

export const GuildSettingsModel = model<GuildSettingsDocument>("GuildSettings", GuildSettingsSchema);
