export const fubaEmojis = {
  acs: "🔥",
  agent: "🎯",
  assists: "🤝",
  defeat: "💢",
  duration: "⏳",
  firstBlood: "🩸",
  firstDeath: "💀",
  headshot: "🎯",
  kd: "📈",
  kda: "🗡️",
  kills: "⚔️",
  leaderboardFirst: "🥇",
  leaderboardSecond: "🥈",
  leaderboardThird: "🥉",
  specialEvents: "✨",
  victory: "🏆",
  matchMvp: "<:GoldMvp:1513597586005823601>",
  teamMvp: "<:SilverMvp:1513597562085445854>",
  rankDefault: "<:Unranked:1513579627052929104>",
  roundWin: "<:Green:1513602281201729556>",
  roundLoss: "<:Red:1513602297639473283>",
  roundUnknown: "<:Grey:1513602899970752662>",
};

export const valorantRankEmojis: Record<number, string> = {
  0: fubaEmojis.rankDefault,
  1: "<:Iron_1_Rank:1513578405453627655>",
  2: "<:Iron_2_Rank:1513578418682204251>",
  3: "<:Iron_3_Rank:1513578431923884133>",
  4: "<:Bronze_1_Rank:1513578457156817086>",
  5: "<:Bronze_2_Rank:1513578470121279578>",
  6: "<:Bronze_3_Rank:1513578485065580624>",
  7: "<:Silver_1_Rank:1513578504044941583>",
  8: "<:Silver_2_Rank:1513578516086526003>",
  9: "<:Silver_3_Rank:1513578538698018986>",
  10: "<:Gold_1_Rank:1513578556142256271>",
  11: "<:Gold_2_Rank:1513578569832337519>",
  12: "<:Gold_3_Rank:1513578581849145364>",
  13: "<:Platinum_1_Rank:1513578595208138864>",
  14: "<:Platinum_2_Rank:1513578605790367774>",
  15: "<:Platinum_3_Rank:1513578618859684111>",
  16: "<:Diamond_1_Rank:1513578641143889981>",
  17: "<:Diamond_2_Rank:1513578653907419236>",
  18: "<:Diamond_3_Rank:1513578665512927262>",
  19: "<:Ascendant_1_Rank:1513578681396756651>",
  20: "<:Ascendant_2_Rank:1513578694910673016>",
  21: "<:Ascendant_3_Rank:1513578721750286530>",
  22: "<:Immortal_1_Rank:1513578735994142920>",
  23: "<:Immortal_2_Rank:1513578760396341390>",
  24: "<:Immortal_3_Rank:1513578774745317406>",
  25: "<:Radiant_Rank:1513578788917608630>",
};

export const getRankEmoji = (tier?: number) =>
  tier === undefined
    ? fubaEmojis.rankDefault
    : (valorantRankEmojis[tier] ?? fubaEmojis.rankDefault);

export const getRankEmojiByName = (rank?: string) => {
  if (!rank) return fubaEmojis.rankDefault;
  const normalized = rank.trim().toLowerCase();
  if (normalized === "unrated") return getRankEmoji(0);
  if (normalized === "radiant") return getRankEmoji(25);

  const match = normalized.match(
    /^(iron|bronze|silver|gold|platinum|diamond|ascendant|immortal)\s+([1-3])$/,
  );
  if (!match) return fubaEmojis.rankDefault;

  const baseByRank: Record<string, number> = {
    iron: 1,
    bronze: 4,
    silver: 7,
    gold: 10,
    platinum: 13,
    diamond: 16,
    ascendant: 19,
    immortal: 22,
  };

  return getRankEmoji(baseByRank[match[1]] + Number(match[2]) - 1);
};

export const getLeaderboardMedal = (index: number) =>
  [
    fubaEmojis.leaderboardFirst,
    fubaEmojis.leaderboardSecond,
    fubaEmojis.leaderboardThird,
  ][index] ?? `#${index + 1}`;

export const valorantAgentEmojis: Record<string, string> = {
  astra: "<:agent_astra:1513611143732793435>",
  breach: "<:agent_breach:1513610753628962956>",
  brimstone: "<:agent_brimstone:1513611093820571840>",
  chamber: "<:agent_chamber:1513610681012977664>",
  clove: "<:agent_clove:1513620046755397752>",
  cypher: "<:agent_cypher:1513611055031386313>",
  deadlock: "<:agent_deadlock:1513610641892442152>",
  fade: "<:agent_fade:1513610436367487037>",
  gekko: "<:agent_gekko:1513610711769809147>",
  harbor: "<:agent_harbor:1513610406055116860>",
  jett: "<:agent_jett:1513610588335374548>",
  kayo: "<:agent_kayo:1513610909153755267>",
  killjoy: "<:agent_killjoy:1513610530605105244>",
  neon: "<:agent_neon:1513610871912534297>",
  omen: "<:agent_omen:1513610561487765755>",
  phoenix: "<:agent_phoenix:1513611012807590099>",
  raze: "<:agent_raze:1513610502637355149>",
  reyna: "<:agent_reyna:1513610835178557681>",
  sage: "<:agent_sage:1513611200557224126>",
  skye: "<:agent_skye:1513610977839546379>",
  sova: "<:agent_sova:1513610472358936577>",
  tejo: "<:agent_tejo:1513677375865487473>",
  viper: "<:agent_viper:1513610800676212756>",
  vyse: "<:agent_vyse:1513620070356619304>",
  waylay: "<:agent_waylay:1513620098022375704>",
  yoru: "<:agent_yoru:1513611172434415766>",
};

export const getAgentEmoji = (agent?: string) => {
  if (!agent) return fubaEmojis.agent;
  const key = agent.trim().toLowerCase();
  const normalizedKey = key.replace(/[^a-z0-9]/g, "");
  return valorantAgentEmojis[key] ?? valorantAgentEmojis[normalizedKey] ?? fubaEmojis.agent;
};

export const fblScoreEmoji = "<:FBL_Score:1513646191823556812>";

export const fblScoreGradeEmojis: Record<string, string> = {
  S: "<:FBS_Crystal:1513696911608250539>",
  A: "<:FBS_Gold:1513696932055351346>",
  B: "<:FBS_Silver:1513696953307758672>",
  C: "<:FBS_Bronze:1513696974820479097>",
  D: "<:FBS_Dark:1513696993745305640>",
  "Br0s & Ana": "<:FBS_Shit:1513697010329321613>",
};
