export type MatchSpecialEventStats = {
  firstBloods: number;
  firstDeaths: number;
  combatScore: number;
  acs: number;
  kills: number;
  deaths: number;
  assists: number;
  roundsPlayed: number;
  rounds: number;
  teamScore?: number;
  enemyScore?: number;
  won?: boolean;
  playtimeMillis: number;
  totalDamage: number;
  headshots: number;
  bodyshots: number;
  legshots: number;
  headshotPercent: number;
  bodyshotPercent: number;
  legshotPercent: number;
  plants: number;
  defuses: number;
  avgLoadoutValue: number;
  totalSpent: number;
  totalRemaining: number;
  grenadeCasts: number;
  ability1Casts: number;
  ability2Casts: number;
  ultimateCasts: number;
  totalAbilityCasts: number;
  multiKills: number;
  aces: number;
  maxKillsInRound: number;
  maxKilllessRoundStreak: number;
};

export type MatchSpecialEvent = {
  key: string;
  name: string;
  emoji: string;
  description: string;
  matches(stats: MatchSpecialEventStats): boolean;
  getDetail?(stats: MatchSpecialEventStats): string | undefined;
};

export const matchSpecialEvents: MatchSpecialEvent[] = [
  {
    key: "ivg-tech",
    name: "Ivg Tech",
    emoji: "⚰️",
    description: "Lots of first deaths!",
    matches: (stats) => stats.firstBloods - stats.firstDeaths <= -3,
    getDetail: (stats) => `${stats.firstBloods - stats.firstDeaths} FB/FD`,
  },
  {
    key: "foca-dd",
    name: "Foca's Double Digits",
    emoji: "👯",
    description: "Only 2 digits of ACS!",
    matches: (stats) => stats.acs < 100,
    getDetail: (stats) => `${stats.acs} ACS`,
  },
  {
    key: "raffaxl",
    name: "RaffaXL Pacifism",
    emoji: "❤️‍🩹",
    description: "No kills.",
    matches: (stats) => stats.kills === 0,
  },
  {
    key: "bros",
    name: "Br0s Performance",
    emoji: "👬",
    description: "Have at least -10 K/D.",
    matches: (stats) =>
      stats.kills - stats.deaths <= -10 && stats.kills - stats.deaths > -15,
    getDetail: (stats) => `${stats.kills - stats.deaths} K/D diff`,
  },
  {
    key: "prime-bros",
    name: "Prime Br0s Performance",
    emoji: "🫂",
    description: "Have at least -15 K/D.",
    matches: (stats) => stats.kills - stats.deaths <= -15,
    getDetail: (stats) => `${stats.kills - stats.deaths} K/D diff`,
  },
  {
    key: "lz-incident",
    name: "Lz Incident",
    emoji: "🪦",
    description: "Die more than the number of rounds.",
    matches: (stats) => stats.roundsPlayed < stats.deaths,
    getDetail: (stats) => `${stats.deaths} deaths in ${stats.roundsPlayed} rounds`,
  },
  {
    key: "victim",
    name: "Victim",
    emoji: "☠️",
    description: "Die all the rounds.",
    matches: (stats) => stats.roundsPlayed === stats.deaths,
    getDetail: (stats) => `${stats.deaths}/${stats.roundsPlayed} rounds`,
  },
  {
    key: "flavor-victim",
    name: "Fla-VOR Victim",
    emoji: "🕯️",
    description: "Almost die all the rounds.",
    matches: (stats) =>
      stats.roundsPlayed > 0 &&
      stats.deaths < stats.roundsPlayed &&
      stats.roundsPlayed - stats.deaths <= 4,
    getDetail: (stats) => `${stats.deaths}/${stats.roundsPlayed} rounds`,
  },
  {
    key: "reverse-ivg",
    name: "gvI (Reverse-Ivg)",
    emoji: "🔪",
    description: "Great First Bloods!",
    matches: (stats) => stats.firstBloods - stats.firstDeaths >= +3,
    getDetail: (stats) => `+${stats.firstBloods - stats.firstDeaths} FB/FD`,
  },
  {
    key: "fuba",
    name: "Fubá Try So Hard",
    emoji: "🥀",
    description: "Great ACS. Someone made some mistakes...",
    matches: (stats) => stats.acs >= 280 && !stats.won,
    getDetail: (stats) => `${stats.acs} ACS`,
  },
  {
    key: "great-kd",
    name: "Carry",
    emoji: "🎒",
    description: "Great ACS.",
    matches: (stats) => stats.acs >= 280 && stats.won === true,
    getDetail: (stats) => `${stats.acs} ACS`,
  },
  {
    key: "foca-hs",
    name: "AMO UMA X0X0TINH Aim",
    emoji: "🏹",
    description: "Terrible HS%.",
    matches: (stats) => stats.headshotPercent <= 15,
    getDetail: (stats) => `${stats.headshotPercent}% HS`,
  },
  {
    key: "sacy",
    name: "Gayci",
    emoji: "👨🏻‍🦲",
    description: "A lot of bodyshots!",
    matches: (stats) => stats.bodyshotPercent >= 80,
    getDetail: (stats) => `${stats.bodyshotPercent}% bodyshots`,
  },
  {
    key: "lz-bait",
    name: "Lz Classic",
    emoji: "🪝",
    description: "Great K/D, but where is the first contact conversion?",
    matches: (stats) => {
      const openingDuels = stats.firstBloods + stats.firstDeaths;
      const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
      const openingDuelRate = openingDuels / Math.max(stats.roundsPlayed, 1);
      const killsPerOpeningDuel = stats.kills / Math.max(openingDuels, 1);

      return (
        stats.roundsPlayed >= 18 &&
        stats.kills >= 20 &&
        kd >= 1.3 &&
        openingDuelRate <= 0.16 &&
        killsPerOpeningDuel >= 5
      );
    },
    getDetail: (stats) => {
      const openingDuels = stats.firstBloods + stats.firstDeaths;
      const kd = stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills;
      return `${kd.toFixed(2)} K/D, ${openingDuels} opening duels`;
    },
  },
  {
    key: "lz-dont-bait",
    name: "Lz Doesn't Bait Incident",
    emoji: "🕒",
    description: "A lot of rounds without a single kill.",
    matches: (stats) => stats.maxKilllessRoundStreak >= 10,
    getDetail: (stats) => `${stats.maxKilllessRoundStreak} rounds`,
  },
  {
    key: "ace",
    name: "Ace",
    emoji: "🃏",
    description: "Got 5+ kills in a round.",
    matches: (stats) => stats.aces === 1,
    getDetail: (stats) => `${stats.maxKillsInRound} kills in one round`,
  },
];

export type MatchedSpecialEvent = MatchSpecialEvent & {
  detail?: string;
};

export const getMatchSpecialEvents = (stats: MatchSpecialEventStats): MatchedSpecialEvent[] =>
  matchSpecialEvents
    .filter((event) => event.matches(stats))
    .map((event) => ({
      ...event,
      detail: event.getDetail?.(stats),
    }));

const getKillDeathRatio = (
  stats: Pick<MatchSpecialEventStats, "kills" | "deaths">,
) => (stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills);
