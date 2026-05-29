import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const connectMongo = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  await dropLegacyMatchIndexes();
  logger.info("MongoDB connected");
};

const dropLegacyMatchIndexes = async () => {
  const collection = mongoose.connection.db?.collection("matches");
  if (!collection) return;

  const indexes = await collection.indexes();
  const legacyIndex = indexes.find((index) => index.name === "guildId_1_provider_1_providerMatchId_1");
  if (!legacyIndex) return;

  await collection.dropIndex("guildId_1_provider_1_providerMatchId_1");
  logger.info("Dropped legacy match unique index", {
    index: "guildId_1_provider_1_providerMatchId_1"
  });
};
