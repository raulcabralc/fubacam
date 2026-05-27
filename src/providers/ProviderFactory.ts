import { env } from "../config/env";
import { MatchProvider } from "./MatchProvider";
import { MockMatchProvider } from "./MockMatchProvider";
import { RiotMatchProvider } from "./RiotMatchProvider";
import { TrackerMatchProvider } from "./TrackerMatchProvider";

export const createMatchProvider = (): MatchProvider => {
  if (env.MATCH_PROVIDER === "mock") return new MockMatchProvider();
  if (env.MATCH_PROVIDER === "riot") return new RiotMatchProvider();
  return new TrackerMatchProvider();
};
