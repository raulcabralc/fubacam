import mongoose from "mongoose";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const connectMongo = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info("MongoDB connected");
};
