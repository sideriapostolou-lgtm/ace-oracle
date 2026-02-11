import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCountryFlag } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { History, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Picks | AceOracle",
  description: "Track your tennis prediction picks and see your results.",
};

export const dynamic = "force-dynamic";

export default async function PicksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;

  const picks = await prisma.pick.findMany({
    where: { userId },
    include: {
      match: {
        include: { player1: true, player2: true, winner: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Stats
  const total = picks.length;
  const correct = picks.filter((p) => p.result === "correct").length;
  const incorrect = picks.filter((p) => p.result === "incorrect").length;
  const pending = picks.filter((p) => p.result === "pending").length;
  const accuracy =
    total - pending > 0
      ? Math.round((correct / (correct + incorrect)) * 100)
      : 0;

  return (
    <div className="court-bg grid-bg min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500">
            <History className="h-5 w-5 text-black" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-black tracking-wider text-white">
              MY PICKS
            </h1>
            <p className="text-sm text-gray-400">
              Your prediction history and results
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-card px-4 py-3 text-center">
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-[11px] text-gray-500">Total Picks</p>
          </div>
          <div className="glass-card px-4 py-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{correct}</p>
            <p className="text-[11px] text-gray-500">Correct</p>
          </div>
          <div className="glass-card px-4 py-3 text-center">
            <p className="text-2xl font-bold text-red-400">{incorrect}</p>
            <p className="text-[11px] text-gray-500">Incorrect</p>
          </div>
          <div className="glass-card px-4 py-3 text-center">
            <p className="text-2xl font-bold text-lime-400">{accuracy}%</p>
            <p className="text-[11px] text-gray-500">Accuracy</p>
          </div>
        </div>

        {/* Picks Table */}
        {picks.length > 0 ? (
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
                    Your Pick
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {picks.map((pick) => {
                  const pickedPlayer =
                    pick.pickedPlayerId === pick.match.player1.id
                      ? pick.match.player1
                      : pick.match.player2;

                  return (
                    <tr
                      key={pick.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/match/${pick.matchId}`}
                          className="text-sm font-medium text-white hover:text-lime-300"
                        >
                          {pick.match.player1.name} vs {pick.match.player2.name}
                        </Link>
                        <p className="text-[11px] text-gray-500 sm:hidden">
                          {pick.match.tournament}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 text-gray-400 sm:table-cell">
                        {pick.match.tournament} · {pick.match.round}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                          {getCountryFlag(pickedPlayer.country)}{" "}
                          {pickedPlayer.name.split(" ").pop()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                            pick.result === "correct"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : pick.result === "incorrect"
                                ? "bg-red-500/20 text-red-400"
                                : "bg-yellow-500/20 text-yellow-400",
                          )}
                        >
                          {pick.result === "correct" && (
                            <CheckCircle2 className="h-3 w-3" />
                          )}
                          {pick.result === "incorrect" && (
                            <XCircle className="h-3 w-3" />
                          )}
                          {pick.result === "pending" && (
                            <Clock className="h-3 w-3" />
                          )}
                          {pick.result === "correct"
                            ? "Won"
                            : pick.result === "incorrect"
                              ? "Lost"
                              : "Pending"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="glass-card py-16 text-center">
            <History className="mx-auto mb-3 h-10 w-10 text-gray-600" />
            <p className="text-lg font-semibold text-gray-300">No picks yet</p>
            <p className="mt-1 text-sm text-gray-500">
              Head to the{" "}
              <Link href="/" className="text-lime-400 hover:text-lime-300">
                home page
              </Link>{" "}
              to start picking winners
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
