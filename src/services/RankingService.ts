import { MatchModel } from "../database/models/Match.model";

export type RankingRow = {
  discordUserId: string;
  riotName: string;
  tagLine: string;
  matches: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  firstBloods: number;
  firstDeaths: number;
  kd: number;
  winRate: number;
};

export class RankingService {
  async getGuildRanking(guildId: string): Promise<RankingRow[]> {
    const rows = await MatchModel.aggregate<RankingRow>([
      { $match: { guildId } },
      {
        $group: {
          _id: "$playerDiscordUserId",
          riotName: { $first: "$riotName" },
          tagLine: { $first: "$tagLine" },
          matches: { $sum: 1 },
          wins: { $sum: { $cond: ["$won", 1, 0] } },
          kills: { $sum: { $ifNull: ["$kills", 0] } },
          deaths: { $sum: { $ifNull: ["$deaths", 0] } },
          assists: { $sum: { $ifNull: ["$assists", 0] } },
          firstBloods: {
            $sum: {
              $ifNull: ["$firstBloods", { $cond: ["$firstBlood", 1, 0] }]
            }
          },
          firstDeaths: {
            $sum: {
              $ifNull: ["$firstDeaths", { $cond: ["$firstDeath", 1, 0] }]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          discordUserId: "$_id",
          riotName: 1,
          tagLine: 1,
          matches: 1,
          wins: 1,
          kills: 1,
          deaths: 1,
          assists: 1,
          firstBloods: 1,
          firstDeaths: 1,
          kd: { $cond: [{ $eq: ["$deaths", 0] }, "$kills", { $divide: ["$kills", "$deaths"] }] },
          winRate: { $cond: [{ $eq: ["$matches", 0] }, 0, { $divide: ["$wins", "$matches"] }] }
        }
      },
      { $sort: { wins: -1, kd: -1, matches: -1 } },
      { $limit: 10 }
    ]);

    return rows;
  }
}
