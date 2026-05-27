import { GuildSettingsModel } from "../database/models/GuildSettings.model";

export class GuildSettingsService {
  async getOrCreate(guildId: string) {
    return GuildSettingsModel.findOneAndUpdate(
      { guildId },
      { $setOnInsert: { guildId, trackingEnabled: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async setChannel(guildId: string, summaryChannelId: string) {
    return GuildSettingsModel.findOneAndUpdate(
      { guildId },
      { summaryChannelId, trackingEnabled: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  async setLastTrackingCheck(guildId: string, date: Date) {
    return GuildSettingsModel.findOneAndUpdate(
      { guildId },
      { lastTrackingCheckAt: date },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}
