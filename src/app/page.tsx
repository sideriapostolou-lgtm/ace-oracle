import { prisma } from "@/lib/db";
import { generatePrediction } from "@/lib/predictions";
import { getSeasonRecord } from "@/lib/result-checker";
import { getLearningStats } from "@/lib/learning-engine";
import DashboardClient from "@/components/DashboardClient";
import LearningEngine from "@/components/LearningEngine";
import type { MatchWithPrediction } from "@/components/DashboardClient";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 300;

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  const matches = await prisma.match.findMany({
    where: { status: "upcoming" },
    include: { player1: true, player2: true },
    orderBy: { startTime: "asc" },
  });

  let userPicks: Record<string, string> = {};
  if (session?.user) {
    const userId = (session.user as { id: string }).id;
    const picks = await prisma.pick.findMany({
      where: { userId },
    });
    userPicks = Object.fromEntries(
      picks.map((p) => [p.matchId, p.pickedPlayerId]),
    );
  }

  const matchesWithPredictions: MatchWithPrediction[] = matches.map((m) => {
    const prediction = generatePrediction(
      {
        id: m.player1.id,
        name: m.player1.name,
        ranking: m.player1.ranking,
        surfaceWin: m.player1.surfaceWin,
        wonLost: m.player1.wonLost,
        titles: m.player1.titles,
      },
      {
        id: m.player2.id,
        name: m.player2.name,
        ranking: m.player2.ranking,
        surfaceWin: m.player2.surfaceWin,
        wonLost: m.player2.wonLost,
        titles: m.player2.titles,
      },
      m.surface,
    );

    return {
      id: m.id,
      tournament: m.tournament,
      round: m.round,
      surface: m.surface,
      startTime: m.startTime.toISOString(),
      tour: m.tour,
      player1: {
        id: m.player1.id,
        name: m.player1.name,
        country: m.player1.country,
        ranking: m.player1.ranking,
      },
      player2: {
        id: m.player2.id,
        name: m.player2.name,
        country: m.player2.country,
        ranking: m.player2.ranking,
      },
      p1WinPct: prediction.p1WinPct,
      p2WinPct: prediction.p2WinPct,
      confidence: prediction.confidence,
      favoriteId: prediction.favoriteId,
      favoriteName: prediction.favoriteName,
      factors: prediction.factors,
    };
  });

  // Split into today's matches and upcoming (future) matches
  const todayMatches = matchesWithPredictions.filter((m) =>
    isToday(new Date(m.startTime)),
  );
  const upcomingMatches = matchesWithPredictions.filter(
    (m) => !isToday(new Date(m.startTime)),
  );

  const hasMatchesToday = todayMatches.length > 0;

  const lockOfDay = hasMatchesToday
    ? todayMatches.reduce((best, m) =>
        m.confidence > best.confidence ? m : best,
      )
    : null;

  const otherTodayMatches = todayMatches.filter((m) => m.id !== lockOfDay?.id);

  // For the "Next up" banner when no matches today
  const nextMatch = upcomingMatches.length > 0 ? upcomingMatches[0] : null;
  const nextTournament = nextMatch?.tournament ?? null;
  const nextDate = nextMatch
    ? new Date(nextMatch.startTime).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
      })
    : null;

  const record = await getSeasonRecord();
  const learningStats = getLearningStats();
  const todayCount = todayMatches.length;

  return (
    <div className="container">
      {/* Header */}
      <header className="site-header">
        <h1 className="font-heading">ACE ORACLE</h1>
        <p className="tagline">AI Tennis Predictions</p>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <div
            className={`stat-value mono ${record.total > 0 ? (record.accuracy >= 55 ? "good" : record.accuracy < 50 ? "bad" : "") : ""}`}
          >
            {record.wins}-{record.losses}
          </div>
          <div className="stat-label">Record</div>
        </div>
        <div className="stat">
          <div
            className={`stat-value mono ${record.total > 0 ? (record.accuracy >= 55 ? "good" : record.accuracy < 50 ? "bad" : "") : ""}`}
          >
            {record.total > 0 ? `${record.accuracy}%` : "—"}
          </div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat">
          <div className="stat-value mono">{todayCount}</div>
          <div className="stat-label">Today</div>
        </div>
      </div>

      {/* AI Learning Engine */}
      <LearningEngine stats={learningStats} />

      {/* Dashboard */}
      <DashboardClient
        matches={hasMatchesToday ? otherTodayMatches : []}
        lockOfDay={lockOfDay}
        userPicks={userPicks}
        upcomingMatches={hasMatchesToday ? [] : upcomingMatches}
        nextTournament={nextTournament}
        nextDate={nextDate}
      />
    </div>
  );
}
