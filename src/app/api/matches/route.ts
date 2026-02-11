import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const tour = searchParams.get("tour");
    const status = searchParams.get("status");
    const tournament = searchParams.get("tournament");

    const where: Record<string, unknown> = {};

    if (tour) {
      where.tour = tour;
    }

    if (status) {
      where.status = status;
    }

    if (tournament) {
      where.tournament = {
        contains: tournament,
      };
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        player1: true,
        player2: true,
        winner: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    return NextResponse.json({ success: true, data: matches });
  } catch (error) {
    console.error("GET /api/matches error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch matches",
      },
      { status: 500 },
    );
  }
}
