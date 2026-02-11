import { prisma } from "@/lib/db";
import { Trophy, Medal, Crown } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Leaderboard | AceOracle",
  description: "Top predictors ranked by accuracy and points.",
};

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    include: {
      predictions: true,
    },
  });

  const leaderboard = users
    .map((user) => {
      const total = user.predictions.length;
      const correct = user.predictions.filter(
        (p) => p.result === "correct",
      ).length;
      const points = user.predictions.reduce((sum, p) => sum + p.points, 0);
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
      return {
        id: user.id,
        name: user.name || "Anonymous",
        total,
        correct,
        points,
        accuracy,
      };
    })
    .filter((u) => u.total > 0)
    .sort((a, b) => b.points - a.points);

  const mockLeaderboard =
    leaderboard.length > 0
      ? leaderboard
      : [
          {
            id: "1",
            name: "TennisGuru99",
            total: 142,
            correct: 118,
            points: 2840,
            accuracy: 83,
          },
          {
            id: "2",
            name: "AceHunter",
            total: 128,
            correct: 109,
            points: 2620,
            accuracy: 85,
          },
          {
            id: "3",
            name: "CourtWhisperer",
            total: 115,
            correct: 94,
            points: 2310,
            accuracy: 82,
          },
          {
            id: "4",
            name: "NetMaster",
            total: 98,
            correct: 78,
            points: 1890,
            accuracy: 80,
          },
          {
            id: "5",
            name: "ServeKing",
            total: 87,
            correct: 71,
            points: 1720,
            accuracy: 82,
          },
          {
            id: "6",
            name: "MatchPoint_Pro",
            total: 76,
            correct: 65,
            points: 1580,
            accuracy: 86,
          },
          {
            id: "7",
            name: "RallyQueen",
            total: 64,
            correct: 50,
            points: 1230,
            accuracy: 78,
          },
          {
            id: "8",
            name: "BreakPointBoss",
            total: 58,
            correct: 47,
            points: 1150,
            accuracy: 81,
          },
          {
            id: "9",
            name: "TiebreakerTom",
            total: 45,
            correct: 34,
            points: 860,
            accuracy: 76,
          },
          {
            id: "10",
            name: "GrandSlamGal",
            total: 39,
            correct: 32,
            points: 780,
            accuracy: 82,
          },
        ];

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-6 w-6 text-yellow-400" />;
    if (index === 1) return <Medal className="h-6 w-6 text-gray-300" />;
    if (index === 2) return <Medal className="h-6 w-6 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-600">{index + 1}</span>;
  };

  return (
    <div className="court-bg grid-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-lg shadow-yellow-500/25">
              <Trophy className="h-7 w-7 text-black" />
            </div>
          </div>
          <h1 className="text-4xl font-black">
            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-300 bg-clip-text text-transparent">
              Prediction Leaderboard
            </span>
          </h1>
          <p className="mt-2 text-gray-400">
            Top predictors ranked by total points earned
          </p>
        </div>

        {/* Top 3 Podium */}
        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((order, i) => {
            const u = mockLeaderboard[order];
            if (!u) return null;
            const podiumColors = [
              "from-yellow-500/20 to-yellow-500/5 border-yellow-500/30",
              "from-gray-400/20 to-gray-400/5 border-gray-400/30",
              "from-amber-600/20 to-amber-600/5 border-amber-600/30",
            ];
            return (
              <div
                key={u.id}
                className={`rounded-2xl border bg-gradient-to-b p-6 text-center backdrop-blur-xl ${podiumColors[i]} ${i === 0 ? "sm:-mt-4" : ""}`}
              >
                <div className="mb-3 flex justify-center">
                  {getRankIcon(order)}
                </div>
                <p className="text-lg font-bold text-white">{u.name}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="text-xl font-black text-white">
                      {u.points.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Points</p>
                  </div>
                  <div className="rounded-lg bg-white/5 p-2">
                    <p className="text-xl font-black text-lime-400">
                      {u.accuracy}%
                    </p>
                    <p className="text-xs text-gray-500">Accuracy</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Full Rankings Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="grid grid-cols-12 gap-4 border-b border-white/10 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Predictor</div>
            <div className="col-span-2 text-right">Points</div>
            <div className="col-span-2 text-right">Accuracy</div>
            <div className="col-span-3 text-right">Predictions</div>
          </div>

          <div className="divide-y divide-white/5">
            {mockLeaderboard.map((user, index) => (
              <div
                key={user.id}
                className="grid grid-cols-12 items-center gap-4 px-6 py-4 transition-colors hover:bg-white/5"
              >
                <div className="col-span-1 flex h-8 w-8 items-center justify-center">
                  {getRankIcon(index)}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-lime-400/20 to-emerald-500/20 text-sm font-bold text-lime-400">
                    {user.name.charAt(0)}
                  </div>
                  <p className="font-semibold text-white">{user.name}</p>
                </div>
                <div className="col-span-2 text-right">
                  <span className="font-mono text-sm font-bold text-white">
                    {user.points.toLocaleString()}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span
                    className={`font-mono text-sm font-bold ${
                      user.accuracy >= 85
                        ? "text-lime-400"
                        : user.accuracy >= 75
                          ? "text-emerald-400"
                          : "text-gray-400"
                    }`}
                  >
                    {user.accuracy}%
                  </span>
                </div>
                <div className="col-span-3 text-right">
                  <span className="text-sm text-gray-400">
                    {user.correct}/{user.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
