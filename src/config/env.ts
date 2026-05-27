import "dotenv/config";
import { z } from "zod";

const EnvSchema = z
  .object({
    DISCORD_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_GUILD_ID: z.string().optional(),
    MONGODB_URI: z.string().min(1),
    TRACKER_API_KEY: z.string().optional().default(""),
    TRACKER_API_BASE_URL: z.string().url().default("https://public-api.tracker.gg"),
    RIOT_API_KEY: z.string().optional().default(""),
    RIOT_CLIENT_ID: z.string().optional().default(""),
    RIOT_CLIENT_SECRET: z.string().optional().default(""),
    RIOT_REDIRECT_URI: z.string().url().optional(),
    RIOT_API_REGION: z.enum(["americas", "asia", "europe", "sea"]).default("americas"),
    AUTH_SERVER_PORT: z.coerce.number().int().positive().default(3001),
    MATCH_PROVIDER: z.enum(["tracker", "mock", "riot"]).default("tracker"),
    TRACKING_CRON: z.string().default("*/5 * * * *"),
    NODE_ENV: z.string().default("development")
  })
  .superRefine((value, context) => {
    if (value.MATCH_PROVIDER === "tracker" && !value.TRACKER_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["TRACKER_API_KEY"],
        message: "TRACKER_API_KEY is required when MATCH_PROVIDER=tracker"
      });
    }

    if (value.MATCH_PROVIDER === "riot" && !value.RIOT_API_KEY) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RIOT_API_KEY"],
        message: "RIOT_API_KEY is required when MATCH_PROVIDER=riot"
      });
    }

    if (value.MATCH_PROVIDER === "riot" && (!value.RIOT_CLIENT_ID || !value.RIOT_CLIENT_SECRET || !value.RIOT_REDIRECT_URI)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["RIOT_CLIENT_ID"],
        message: "RIOT_CLIENT_ID, RIOT_CLIENT_SECRET and RIOT_REDIRECT_URI are required when MATCH_PROVIDER=riot"
      });
    }
  });

export const env = EnvSchema.parse(process.env);
