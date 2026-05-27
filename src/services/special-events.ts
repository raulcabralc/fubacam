export type MatchSpecialEventStats = {
  firstBloods: number;
  firstDeaths: number;
  acs: number;
  kills: number;
  deaths: number;
  rounds: number;
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
    matches: (stats) => stats.rounds < stats.deaths,
  },
  {
    key: "victim",
    name: "Victim",
    emoji: "🥀",
    description: "Die all the rounds.",
    matches: (stats) => stats.rounds === stats.deaths,
  },
  {
    key: "flavor-victim",
    name: "Fla-VOR Victim",
    emoji: "🕯️",
    description: "Almost die all the rounds.",
    matches: (stats) => stats.rounds - stats.deaths < stats.rounds - 4,
  },
];

export const getMatchSpecialEvents = (stats: MatchSpecialEventStats) =>
  matchSpecialEvents.filter((event) => event.matches(stats));
