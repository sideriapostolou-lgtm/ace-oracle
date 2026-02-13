import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadPredictionMemory,
  resolveResult,
  getLearningStats,
  getTennisSeasonState,
} from "@/lib/learning-engine";

const ESPN_ATP_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard";
const ESPN_WTA_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard";

interface ESPNCompetitor {
  id: string;
  athlete?: { displayName?: string };
  winner?: boolean;
  score?: { displayValue?: string };
}

interface ESPNEvent {
  id: string;
  name?: string;
  status?: { type?: { name?: string; completed?: boolean } };
  competitions?: Array<{
    competitors?: ESPNCompetitor[];
    status?: { type?: { name?: string } };
  }>;
}

interface ESPNScoreboard {
  events?: ESPNEvent[];
}

/**
 * Normalize player name for fuzzy matching.
 * ESPN names may differ from our DB (accents, suffixes, etc.)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/\s+(jr|sr|ii|iii|iv)\.?$/i, "") // strip suffixes
    .trim();
}

/**
 * Fetch completed matches from ESPN and resolve predictions.
 */
async function resolveFromESPN(): Promise<{
  resolved: number;
  checked: number;
}> {
  let resolved = 0;
  let checked = 0;

  // Get all pending predictions from learning memory
  const mem = loadPredictionMemory();
  const pendingIds = new Set(
    mem.predictions.filter((p) => p.result === null).map((p) => p.matchId),
  );

  if (pendingIds.size === 0) {
    return { resolved: 0, checked: 0 };
  }

  // Also get pending matches from DB (status = "upcoming")
  const pendingMatches = await prisma.match.findMany({
    where: { status: "upcoming" },
    include: { player1: true, player2: true },
  });

  // Build a lookup: normalized player names -> match info
  const matchLookup = new Map<
    string,
    { matchId: string; player1Name: string; player2Name: string }
  >();
  for (const m of pendingMatches) {
    const key = [normalizeName(m.player1.name), normalizeName(m.player2.name)]
      .sort()
      .join("|");
    matchLookup.set(key, {
      matchId: m.id,
      player1Name: m.player1.name,
      player2Name: m.player2.name,
    });
  }

  // Fetch both ATP and WTA scoreboards
  for (const url of [ESPN_ATP_SCOREBOARD, ESPN_WTA_SCOREBOARD]) {
    try {
      const resp = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) continue;
      const data = (await resp.json()) as ESPNScoreboard;

      for (const event of data.events ?? []) {
        checked++;
        const comp = event.competitions?.[0];
        if (!comp) continue;

        const statusName =
          comp.status?.type?.name ?? event.status?.type?.name ?? "";
        if (statusName !== "STATUS_FINAL") continue;

        const competitors = comp.competitors ?? [];
        if (competitors.length !== 2) continue;

        // Find the winner
        const winner = competitors.find((c) => c.winner === true);
        if (!winner?.athlete?.displayName) continue;

        const p1Name = competitors[0]?.athlete?.displayName ?? "";
        const p2Name = competitors[1]?.athlete?.displayName ?? "";
        const winnerName = winner.athlete.displayName;

        // Try to match against our pending matches
        const key = [normalizeName(p1Name), normalizeName(p2Name)]
          .sort()
          .join("|");
        const match = matchLookup.get(key);

        if (match && pendingIds.has(match.matchId)) {
          // Determine score string
          const scores = competitors
            .map((c) => c.score?.displayValue ?? "")
            .join(", ");

          // Resolve in learning engine
          const actualWinner =
            normalizeName(winnerName) === normalizeName(match.player1Name)
              ? match.player1Name
              : match.player2Name;

          const didResolve = resolveResult(
            match.matchId,
            actualWinner,
            scores || "completed",
          );

          if (didResolve) {
            resolved++;

            // Also update the match in DB
            const dbPlayer = await prisma.player.findFirst({
              where: { name: actualWinner },
            });
            if (dbPlayer) {
              await prisma.match.update({
                where: { id: match.matchId },
                data: {
                  status: "completed",
                  winnerId: dbPlayer.id,
                  score: scores || null,
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.error(`[LEARN] ESPN fetch error for ${url}:`, e);
    }
  }

  return { resolved, checked };
}

/**
 * GET /api/learn — Trigger learning cycle.
 * Called by cron or manually. No auth required (idempotent read+resolve).
 */
export async function GET(): Promise<NextResponse> {
  const startTime = Date.now();
  const seasonState = getTennisSeasonState();

  let espnResult = { resolved: 0, checked: 0 };

  if (seasonState === "active" || seasonState === "preseason") {
    espnResult = await resolveFromESPN();
  }

  const stats = getLearningStats();

  return NextResponse.json({
    success: true,
    seasonState,
    espn: espnResult,
    learning: {
      totalPredictions: stats.totalPredictions,
      totalResolved: stats.totalResolved,
      accuracy: stats.accuracy,
      patternsFound: stats.patternCount,
    },
    durationMs: Date.now() - startTime,
  });
}
