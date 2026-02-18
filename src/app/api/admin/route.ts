import { NextRequest, NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import {
  emptyMemory,
  recordPredictionAsync,
  type PredictionMemory,
} from "@/lib/learning-engine";
import { fetchAllTennisMatches } from "@/lib/espn-tennis";
import { generatePrediction } from "@/lib/predictions";

export const dynamic = "force-dynamic";

const ADMIN_SECRET = process.env.ADMIN_SECRET ?? "REALONES";
const KV_KEY = "prediction_memory";

function checkAuth(request: NextRequest): boolean {
  const secret = new URL(request.url).searchParams.get("secret");
  return secret === ADMIN_SECRET;
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

  // Step 1: Reset tennis prediction memory via direct KV operations
  if (action === "reset" || action === "reset-and-record") {
    try {
      // Read old stats first
      const oldData = await kv.get<PredictionMemory>(KV_KEY);
      const oldStats = oldData
        ? {
            totalPredictions: oldData.totalPredictions,
            totalCorrect: oldData.totalCorrect,
            accuracy: oldData.accuracy,
            predictionsCount: oldData.predictions?.length ?? 0,
          }
        : {
            totalPredictions: 0,
            totalCorrect: 0,
            accuracy: 0,
            predictionsCount: 0,
          };

      // Delete the key entirely, then write fresh
      await kv.del(KV_KEY);
      const fresh = emptyMemory();
      await kv.set(KV_KEY, fresh);

      // Verify with direct kv.get (not loadMemory which might cache)
      const verification = await kv.get<PredictionMemory>(KV_KEY);
      const verified =
        verification !== null && (verification.predictions?.length ?? 0) === 0;

      results.reset = {
        success: verified,
        oldStats,
        newPredictionsCount: verification?.predictions?.length ?? "null",
        verified,
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
