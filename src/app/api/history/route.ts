import { NextResponse } from "next/server";
import { loadMemory } from "@/lib/learning-engine";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const mem = await loadMemory();
    const resolved = mem.predictions.filter(
      (p) => p.correct !== null && p.actualWinner !== null,
    );

    const history = resolved.map((p) => ({
      gameId: p.matchId ?? "",
      date: p.date,
      away: p.player1 ?? "Player 1",
      home: p.player2 ?? "Player 2",
      predictedWinner: p.predictedWinner ?? "—",
      actualWinner: p.actualWinner ?? "—",
      correct: p.correct,
      confidence: p.confidence,
      score: p.result,
    }));

    history.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const total = history.length;
    const correct = history.filter((h) => h.correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          sport: "Tennis",
          history,
          total,
          correct,
          accuracy,
        },
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800",
        },
      },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch history", detail: msg },
      { status: 500 },
    );
  }
}
