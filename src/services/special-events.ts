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
};

export const matchSpecialEvents: MatchSpecialEvent[] = [
  {
    key: "ivg-tech",
    name: "Ivg Tech",
    emoji: "⚰️",
    description: "Lots of first deaths!",
    matches: (stats) => stats.firstBloods - stats.firstDeaths <= -3,
  },
  {
    key: "foca-dd",
    name: "Foca's Double Digits",
    emoji: "👯",
    description: "Only 2 digits of ACS!",
    matches: (stats) => stats.acs < 100,
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
    matches: (stats) => stats.kills - stats.deaths <= -10,
  },
  {
    key: "prime-bros",
    name: "Prime Br0s Performance",
    emoji: "🫂",
    description: "Have at least -15 K/D.",
    matches: (stats) => stats.kills - stats.deaths <= -15,
  },
  {
    key: "lz-incident",
    name: "Lz Incident",
    emoji: "🪦",
    description: "Die more than the number of rounds.",
    matches: (stats) => stats.roundsPlayed < stats.deaths,
  },
  {
    key: "victim",
    name: "Victim",
    emoji: "☠️",
    description: "Die all the rounds.",
    matches: (stats) => stats.roundsPlayed === stats.deaths,
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
  },
  {
    key: "reverse-ivg",
    name: "gvI (Reverse-Ivg)",
    emoji: "🔪",
    description: "Great First Bloods!",
    matches: (stats) => stats.firstBloods - stats.firstDeaths >= +3,
  },
  {
    key: "fuba",
    name: "Fubá Try So Hard",
    emoji: "🥀",
    description: "Great K/D. Someone made some mistakes...",
    matches: (stats) => stats.kills / stats.deaths >= 1.3 && !stats.won,
  },
  {
    key: "great-kd",
    name: "Carry",
    emoji: "🎒",
    description: "Great K/D.",
    matches: (stats) => stats.kills / stats.deaths >= 1.3 && stats.won === true,
  },
  {
    key: "foca-hs",
    name: "AMO UMA X0X0TINH Aim",
    emoji: "🏹",
    description: "Terrible HS%.",
    matches: (stats) => stats.headshotPercent <= 15,
  },
  {
    key: "sacy",
    name: "Gayci",
    emoji: "👨🏻‍🦲",
    description: "A lot of bodyshots!",
    matches: (stats) => stats.bodyshotPercent >= 80,
  },
  {
    key: "lz-bait",
    name: "Lz Classic",
    emoji: "🪝",
    description: "Great K/D, but where is the FB conversion?",
    matches: (stats) =>
      getKillDeathRatio(stats) >= 1.25 &&
      stats.kills >= 18 &&
      stats.firstBloods <= Math.floor(stats.kills / 8),
  },
  {
    key: "lz-dont-bait",
    name: "Lz Doesn't Bait Incident",
    emoji: "🕒",
    description: "A lot of rounds without a single kill.",
    matches: (stats) => stats.maxKilllessRoundStreak >= 10,
  },
];

export const getMatchSpecialEvents = (stats: MatchSpecialEventStats) =>
  matchSpecialEvents.filter((event) => event.matches(stats));

const getKillDeathRatio = (
  stats: Pick<MatchSpecialEventStats, "kills" | "deaths">,
) => (stats.deaths > 0 ? stats.kills / stats.deaths : stats.kills);
