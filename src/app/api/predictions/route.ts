import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
            winner: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, data: predictions });
  } catch (error) {
    console.error("GET /api/predictions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch predictions" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 },
      );
    }

    const userId = (session.user as { id: string }).id;

    const body = await request.json();
    const { matchId, predictedWinner, confidence, reasoning } = body as {
      matchId?: string;
      predictedWinner?: string;
      confidence?: number;
      reasoning?: string;
    };

    // --- Validation ---
    if (!matchId || typeof matchId !== "string") {
      return NextResponse.json(
        { success: false, error: "matchId is required" },
        { status: 400 },
      );
    }

    if (!predictedWinner || typeof predictedWinner !== "string") {
      return NextResponse.json(
        { success: false, error: "predictedWinner is required" },
        { status: 400 },
      );
    }

    if (
      confidence === undefined ||
      typeof confidence !== "number" ||
      confidence < 0 ||
      confidence > 100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "confidence must be a number between 0 and 100",
        },
        { status: 400 },
      );
    }

    // --- Check match exists and is upcoming ---
    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 },
      );
    }

    if (match.status === "completed") {
      return NextResponse.json(
        { success: false, error: "Cannot predict on a completed match" },
        { status: 400 },
      );
    }

    // --- Check predicted winner is one of the players in the match ---
    if (
      predictedWinner !== match.player1Id &&
      predictedWinner !== match.player2Id
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "predictedWinner must be one of the match players",
        },
        { status: 400 },
      );
    }

    // --- Check for duplicate prediction ---
    const existing = await prisma.prediction.findUnique({
      where: {
        userId_matchId: {
          userId,
          matchId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have a prediction for this match",
        },
        { status: 409 },
      );
    }

    // --- Create prediction ---
    const prediction = await prisma.prediction.create({
      data: {
        userId,
        matchId,
        predictedWinner,
        confidence,
        reasoning: reasoning || null,
        result: "pending",
      },
      include: {
        match: {
          include: {
            player1: true,
            player2: true,
          },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: prediction },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/predictions error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create prediction" },
      { status: 500 },
    );
  }
}
