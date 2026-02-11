import { prisma } from "@/lib/db";
import { generatePrediction } from "@/lib/predictions";
import { getSeasonRecord } from "@/lib/result-checker";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DashboardClient from "@/components/DashboardClient";
import type { MatchWithPrediction } from "@/components/DashboardClient";
import { getCountryFlag, getSurfaceColor } from "@/lib/utils";
import Link from "next/link";
import {
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Calendar,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // Fetch upcoming matches with player data
  const matches = await prisma.match.findMany({
    where: { status: "upcoming" },
    include: { player1: true, player2: true },
    orderBy: { startTime: "asc" },
  });

  // Fetch user's existing picks
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

  // Generate predictions for each match
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

  // Lock of the Day: highest confidence match
  const lockOfDay =
    matchesWithPredictions.length > 0
      ? matchesWithPredictions.reduce((best, m) =>
          m.confidence > best.confidence ? m : best,
        )
      : null;

  // Remaining matches (excluding lock of day)
  const otherMatches = matchesWithPredictions.filter(
    (m) => m.id !== lockOfDay?.id,
  );

  // Season record
  const record = await getSeasonRecord();

  // Fetch completed matches (recent results)
  const completedMatches = await prisma.match.findMany({
    where: { status: "completed" },
    include: { player1: true, player2: true, winner: true },
    orderBy: { startTime: "desc" },
    take: 5,
  });

  // Match count
  const matchCount = matches.length;

  return (
    <div className="court-bg grid-bg min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="font-heading mb-2 bg-gradient-to-r from-lime-300 via-emerald-400 to-lime-300 bg-clip-text text-4xl font-black tracking-wider text-transparent sm:text-5xl">
            ACE ORACLE
          </h1>
          <p className="text-sm text-gray-400">
            AI-powered tennis predictions · Pick winners · Track your record
          </p>
        </div>

        {/* Stats Bar */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <Trophy className="h-5 w-5 text-lime-400" />
            <div>
              <p className="text-lg font-bold text-white">
                {record.wins}-{record.losses}
              </p>
              <p className="text-[11px] text-gray-500">Season Record</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <Target className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-lg font-bold text-white">{record.accuracy}%</p>
              <p className="text-[11px] text-gray-500">Accuracy</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <Flame className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-lg font-bold text-white">
                {record.streak > 0
                  ? `${record.streak}W`
                  : `${Math.abs(record.streak)}L`}
              </p>
              <p className="text-[11px] text-gray-500">Streak</p>
            </div>
          </div>
          <div className="glass-card flex items-center gap-3 px-4 py-3">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <div>
              <p className="text-lg font-bold text-white">{record.total}</p>
              <p className="text-[11px] text-gray-500">Predictions</p>
            </div>
          </div>
          <div className="glass-card col-span-2 flex items-center gap-3 px-4 py-3 sm:col-span-1">
            <Calendar className="h-5 w-5 text-purple-400" />
            <div>
              <p className="text-lg font-bold text-white">{matchCount}</p>
              <p className="text-[11px] text-gray-500">Today&apos;s Matches</p>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <DashboardClient
          matches={otherMatches}
          lockOfDay={lockOfDay}
          userPicks={userPicks}
        />

        {/* Recent Results */}
        {completedMatches.length > 0 && (
          <div className="mt-12">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Recent Results
            </h2>
            <div className="glass-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                      Match
                    </th>
                    <th className="hidden px-4 py-3 text-left text-xs font-medium text-gray-500 sm:table-cell">
                      Tournament
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Score
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                      Winner
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {completedMatches.map((m) => (
                    <tr
                      key={m.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/match/${m.id}`}
                          className="font-medium text-white hover:text-lime-300"
                        >
                          {getCountryFlag(m.player1.country)}{" "}
                          {m.player1.name.split(" ").pop()} vs{" "}
                          {getCountryFlag(m.player2.country)}{" "}
                          {m.player2.name.split(" ").pop()}
                        </Link>
                        <p className="text-[11px] text-gray-500 sm:hidden">
                          {m.tournament} · {m.round}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 sm:table-cell">
                        <span className="text-gray-400">{m.tournament}</span>
                        <span className="mx-1 text-gray-600">·</span>
                        <span className="text-gray-500">{m.round}</span>
                        <span className="mx-1 text-gray-600">·</span>
                        <span
                          className={`text-xs ${getSurfaceColor(m.surface).split(" ")[1]}`}
                        >
                          {m.surface}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm font-semibold text-white">
                        {m.score || "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {m.winner ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                            {getCountryFlag(m.winner.country)}{" "}
                            {m.winner.name.split(" ").pop()}
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
