import cron from "node-cron";
import { env } from "../config/env";
import { TrackingService } from "../services/TrackingService";
import { logger } from "../utils/logger";

export const startTrackingScheduler = (trackingService: TrackingService) => {
  const task = cron.schedule(env.TRACKING_CRON, async () => {
    try {
      await trackingService.runOnce();
    } catch (error) {
      logger.warn("Tracking scheduler run failed", {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  logger.info("Tracking scheduler started", { cron: env.TRACKING_CRON });
  return task;
};
