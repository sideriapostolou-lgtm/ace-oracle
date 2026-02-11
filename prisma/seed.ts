import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "node:path";
import {
  atpPlayers,
  wtaPlayers,
  upcomingMatches,
} from "../src/lib/tennis-data";

const dbPath = `file:${path.join(__dirname, "dev.db")}`;
const adapter = new PrismaBetterSqlite3({ url: dbPath });
const prisma = new PrismaClient({ adapter } as never);

async function main(): Promise<void> {
  console.log("Seeding AceOracle database...");

  // --- Seed ATP Players ---
  console.log(`Seeding ${atpPlayers.length} ATP players...`);
  for (const player of atpPlayers) {
    await prisma.player.upsert({
      where: {
        id: `atp-${player.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        country: player.country,
        ranking: player.ranking,
        points: player.points,
        age: player.age,
        height: player.height,
        plays: player.plays,
        titles: player.titles,
        wonLost: player.wonLost,
        surfaceWin: player.surfaceWin,
        tour: "ATP",
      },
      create: {
        id: `atp-${player.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: player.name,
        country: player.country,
        ranking: player.ranking,
        points: player.points,
        age: player.age,
        height: player.height,
        plays: player.plays,
        titles: player.titles,
        wonLost: player.wonLost,
        surfaceWin: player.surfaceWin,
        tour: "ATP",
      },
    });
  }

  // --- Seed WTA Players ---
  console.log(`Seeding ${wtaPlayers.length} WTA players...`);
  for (const player of wtaPlayers) {
    await prisma.player.upsert({
      where: {
        id: `wta-${player.name.toLowerCase().replace(/\s+/g, "-")}`,
      },
      update: {
        country: player.country,
        ranking: player.ranking,
        points: player.points,
        age: player.age,
        height: player.height,
        plays: player.plays,
        titles: player.titles,
        wonLost: player.wonLost,
        surfaceWin: player.surfaceWin,
        tour: "WTA",
      },
      create: {
        id: `wta-${player.name.toLowerCase().replace(/\s+/g, "-")}`,
        name: player.name,
        country: player.country,
        ranking: player.ranking,
        points: player.points,
        age: player.age,
        height: player.height,
        plays: player.plays,
        titles: player.titles,
        wonLost: player.wonLost,
        surfaceWin: player.surfaceWin,
        tour: "WTA",
      },
    });
  }

  // --- Helper: look up player ID by name ---
  function getPlayerId(name: string): string {
    const atpMatch = atpPlayers.find((p) => p.name === name);
    if (atpMatch) {
      return `atp-${atpMatch.name.toLowerCase().replace(/\s+/g, "-")}`;
    }
    const wtaMatch = wtaPlayers.find((p) => p.name === name);
    if (wtaMatch) {
      return `wta-${wtaMatch.name.toLowerCase().replace(/\s+/g, "-")}`;
    }
    throw new Error(`Player not found: ${name}`);
  }

  // --- Seed Matches ---
  console.log(`Seeding ${upcomingMatches.length} matches...`);
  for (let i = 0; i < upcomingMatches.length; i++) {
    const m = upcomingMatches[i];
    const p1Id = getPlayerId(m.p1);
    const p2Id = getPlayerId(m.p2);
    const matchId = `match-${i + 1}-${m.p1.toLowerCase().replace(/\s+/g, "-")}-vs-${m.p2.toLowerCase().replace(/\s+/g, "-")}`;

    const winnerId = m.winner ? getPlayerId(m.winner) : null;
    const status = m.status || "upcoming";
    const score = m.score || null;

    await prisma.match.upsert({
      where: { id: matchId },
      update: {
        tournament: m.tournament,
        round: m.round,
        surface: m.surface,
        tour: m.tour,
        player1Id: p1Id,
        player2Id: p2Id,
        winnerId,
        score,
        status,
        startTime: new Date(m.startTime),
      },
      create: {
        id: matchId,
        tournament: m.tournament,
        round: m.round,
        surface: m.surface,
        tour: m.tour,
        player1Id: p1Id,
        player2Id: p2Id,
        winnerId,
        score,
        status,
        startTime: new Date(m.startTime),
      },
    });
  }

  // --- Seed AI Prediction Record ---
  console.log("Seeding prediction record...");
  await prisma.predictionRecord.upsert({
    where: { season: "2026" },
    update: {
      wins: 147,
      losses: 41,
      pushes: 3,
      streak: 8,
    },
    create: {
      season: "2026",
      wins: 147,
      losses: 41,
      pushes: 3,
      streak: 8,
    },
  });

  // --- Seed Access Codes ---
  console.log("Seeding access codes...");
  const accessCodes = ["REALONES"];
  for (const code of accessCodes) {
    await prisma.accessCode.upsert({
      where: { code },
      update: { active: true },
      create: { code, active: true },
    });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
