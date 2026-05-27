import { MatchProvider } from "../providers/MatchProvider";
import { GuildSettingsService } from "./GuildSettingsService";
import { MatchService } from "./MatchService";
import { PlayerService } from "./PlayerService";
import { RankingService } from "./RankingService";
import { RiotAuthService } from "./RiotAuthService";
import { TrackingService } from "./TrackingService";

export type AppContext = {
  provider: MatchProvider;
  playerService: PlayerService;
  guildSettingsService: GuildSettingsService;
  matchService: MatchService;
  rankingService: RankingService;
  riotAuthService?: RiotAuthService;
  trackingService: TrackingService;
};
