import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generatePrediction } from "@/lib/predictions";

export const dynamic = "force-dynamic";

/**
 * GET /api/model-predictions — Public endpoint for model predictions.
 * Returns predictions for all upcoming matches using the ML model.
 * No auth required. Used by 99c automation agents.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const matches = await prisma.match.findMany({
      where: { status: "upcoming" },
      include: {
        player1: true,
        player2: true,
      },
      orderBy: { startTime: "asc" },
    });

    const predictions = await Promise.all(
      matches.map(async (match) => {
        const prediction = generatePrediction(
          {
            id: match.player1.id,
            name: match.player1.name,
            ranking: match.player1.ranking,
          },
          {
            id: match.player2.id,
            name: match.player2.name,
            ranking: match.player2.ranking,
          },
          match.surface,
          match.round ?? "",
          match.tour ?? "ATP",
        );

        const winPct =
          prediction.p1WinPct >= prediction.p2WinPct
            ? prediction.p1WinPct
            : prediction.p2WinPct;
        const tier = winPct >= 68 ? "LOCK" : winPct >= 58 ? "STRONG" : "LEAN";

        return {
          gameId: match.id,
          away: match.player1.name,
          home: match.player2.name,
          awayName: match.player1.name,
          homeName: match.player2.name,
          predictedWinner: prediction.favoriteName,
          winner: prediction.favoriteName,
          confidence: prediction.confidence,
          winProbability:
            prediction.p1WinPct >= prediction.p2WinPct
              ? prediction.p1WinPct
              : prediction.p2WinPct,
          tier,
          surface: match.surface,
          tournament: match.tournament,
          round: match.round,
          startTime: match.startTime,
          pick: prediction.favoriteName,
          vs:
            prediction.favoriteName === match.player1.name
              ? match.player2.name
              : match.player1.name,
        };
      }),
    );

    // Sort by confidence descending
    predictions.sort((a, b) => b.confidence - a.confidence);

    return NextResponse.json(
      {
        success: true,
        data: { predictions },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=900",
        },
      },
    );
  } catch (error) {
    console.error("GET /api/model-predictions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate predictions" },
      { status: 500 },
    );
  }
}
