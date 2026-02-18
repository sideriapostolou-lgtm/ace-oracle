import { NextRequest, NextResponse } from "next/server";
import {
  saveMemoryToKv,
  loadMemory,
  recordPredictionAsync,
  type PredictionMemory,
} from "@/lib/learning-engine";
import { fetchAllTennisMatches } from "@/lib/espn-tennis";
import { generatePrediction } from "@/lib/predictions";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "REALONES";

function checkAuth(request: NextRequest): boolean {
  const secret = new URL(request.url).searchParams.get("secret");
  return secret === ADMIN_SECRET;
}

function freshMemory(): PredictionMemory {
  return {
    predictions: [],
    factorAccuracy: {
      ranking: { correct: 0, total: 0, accuracy: 0 },
      surface_context: { correct: 0, total: 0, accuracy: 0 },
      round_depth: { correct: 0, total: 0, accuracy: 0 },
      tour_dynamics: { correct: 0, total: 0, accuracy: 0 },
    },
    learnedWeights: {
      ranking: 0.4,
      surface_context: 0.25,
      round_depth: 0.2,
      tour_dynamics: 0.15,
    },
    patterns: [],
    totalPredictions: 0,
    totalCorrect: 0,
    accuracy: 0,
    lastWeightUpdate: null,
    calibration: { buckets: {}, lastCalibrated: null },
    rollingWindows: {
      last10: { correct: 0, total: 0, accuracy: 0 },
      last20: { correct: 0, total: 0, accuracy: 0 },
      last50: { correct: 0, total: 0, accuracy: 0 },
      history: [],
    },
    streaks: { current: 0, longestWin: 0, longestLoss: 0 },
    upsetLog: [],
    h2hResults: {},
    version: 2,
  };
}

/**
 * GET /api/admin?action=reset&secret=REALONES
 * GET /api/admin?action=record&secret=REALONES
 * GET /api/admin?action=reset-and-record&secret=REALONES
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!checkAuth(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const action =
    new URL(request.url).searchParams.get("action") ?? "reset-and-record";
  const results: Record<string, unknown> = { action };

  // Step 1: Reset tennis prediction memory (KV only — Prisma is read-only on Vercel)
  if (action === "reset" || action === "reset-and-record") {
    try {
      const oldMem = await loadMemory();
      const oldStats = {
        totalPredictions: oldMem.totalPredictions,
        totalCorrect: oldMem.totalCorrect,
        accuracy: oldMem.accuracy,
        predictionsCount: oldMem.predictions.length,
      };

      // Write a completely fresh memory object to KV
      const fresh = freshMemory();
      const kvSaved = await saveMemoryToKv(fresh);

      // Verify the write by reading back
      const verification = await loadMemory();
      const verified = verification.predictions.length === 0;

      results.reset = {
        success: kvSaved && verified,
        kvSaved,
        verified,
        oldStats,
        newPredictionsCount: verification.predictions.length,
      };
    } catch (error) {
      results.reset = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Step 2: Record fresh predictions for current matches
  if (action === "record" || action === "reset-and-record") {
    try {
      const groups = await fetchAllTennisMatches();
      let recorded = 0;
      let skipped = 0;

      for (const group of groups) {
        for (const match of group.matches) {
          if (match.state !== "pre") {
            skipped++;
            continue;
          }

          const prediction = generatePrediction(
            {
              id: `${match.id}_p1`,
              name: match.player1.name,
              ranking: match.player1.ranking,
            },
            {
              id: `${match.id}_p2`,
              name: match.player2.name,
              ranking: match.player2.ranking,
            },
            match.surface,
            match.round,
            match.tour,
          );

          const winPct = Math.max(prediction.p1WinPct, prediction.p2WinPct);

          // Build factor favored map for learning engine
          const factors: Record<string, { favored: string }> = {};
          for (const [key, factor] of Object.entries(prediction.factors)) {
            factors[key] = {
              favored:
                factor.p1 >= factor.p2
                  ? match.player1.name
                  : match.player2.name,
            };
          }

          await recordPredictionAsync(
            match.id,
            new Date().toISOString(),
            match.player1.name,
            match.player2.name,
            prediction.favoriteName,
            winPct,
            factors,
          );

          recorded++;
        }
      }

      results.record = { success: true, recorded, skipped };
    } catch (error) {
      results.record = {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  return NextResponse.json({ success: true, ...results });
}
