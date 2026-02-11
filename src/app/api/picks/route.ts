import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const userId = (session.user as { id: string }).id;

  const picks = await prisma.pick.findMany({
    where: { userId },
    include: {
      match: {
        include: { player1: true, player2: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: picks });
}

export async function POST(request: Request): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 },
    );
  }

  const userId = (session.user as { id: string }).id;

  let body: { matchId?: string; pickedPlayerId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const { matchId, pickedPlayerId } = body;
  if (!matchId || !pickedPlayerId) {
    return NextResponse.json(
      { success: false, error: "matchId and pickedPlayerId are required" },
      { status: 400 },
    );
  }

  // Validate match exists and is upcoming
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
      { success: false, error: "Match already completed" },
      { status: 400 },
    );
  }

  // Validate pickedPlayerId is one of the two players
  if (
    pickedPlayerId !== match.player1Id &&
    pickedPlayerId !== match.player2Id
  ) {
    return NextResponse.json(
      { success: false, error: "Invalid player for this match" },
      { status: 400 },
    );
  }

  // Upsert pick (allow changing pick before match starts)
  const pick = await prisma.pick.upsert({
    where: {
      userId_matchId: { userId, matchId },
    },
    update: { pickedPlayerId },
    create: {
      userId,
      matchId,
      pickedPlayerId,
    },
  });

  return NextResponse.json({ success: true, data: pick });
}
