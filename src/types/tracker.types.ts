import { z } from "zod";

export const TrackerSegmentSchema = z.object({
  type: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  stats: z.record(z.unknown()).optional()
});

export const TrackerMatchSchema = z.object({
  attributes: z.record(z.unknown()).optional(),
  metadata: z.record(z.unknown()).optional(),
  segments: z.array(TrackerSegmentSchema).optional()
});

export const TrackerMatchesResponseSchema = z.object({
  data: z.array(TrackerMatchSchema).default([])
});

export type TrackerMatchPayload = z.infer<typeof TrackerMatchSchema>;
