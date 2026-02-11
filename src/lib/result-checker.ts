import { prisma } from "./db";

export interface SeasonRecord {
  wins: number;
  losses: number;
  pushes: number;
  total: number;
  accuracy: number;
  streak: number;
}

export async function getSeasonRecord(): Promise<SeasonRecord> {
  const year = new Date().getFullYear().toString();

  const record = await prisma.predictionRecord.findUnique({
    where: { season: year },
  });

  if (!record) {
    return {
      wins: 0,
      losses: 0,
      pushes: 0,
      total: 0,
      accuracy: 0,
      streak: 0,
    };
  }

  const total = record.wins + record.losses;
  const accuracy =
    total > 0 ? Math.round((record.wins / total) * 1000) / 10 : 0;

  return {
    wins: record.wins,
    losses: record.losses,
    pushes: record.pushes,
    total,
    accuracy,
    streak: record.streak,
  };
}
