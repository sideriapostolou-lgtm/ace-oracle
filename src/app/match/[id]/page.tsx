import { prisma } from "@/lib/db";
import { generatePrediction } from "@/lib/predictions";
import { getCountryFlag, getSurfaceColor } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: { player1: true, player2: true },
  });

  if (!match) return { title: "Match Not Found | AceOracle" };

  return {
    title: `${match.player1.name} vs ${match.player2.name} | AceOracle`,
    description: `AI prediction for ${match.player1.name} vs ${match.player2.name} at ${match.tournament}`,
  };
}

function FactorRow({
  label,
  p1,
  p2,
  p1Name,
  p2Name,
}: {
  label: string;
  p1: number;
  p2: number;
  p1Name: string;
  p2Name: string;
}) {
  return (
    <div className="glass-card p-4">
      <p className="mb-3 text-sm font-medium text-gray-300">{label}</p>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span
          className={p1 >= p2 ? "font-semibold text-lime-400" : "text-gray-400"}
        >
          {p1Name} · {p1}%
        </span>
        <span
          className={p2 > p1 ? "font-semibold text-lime-400" : "text-gray-400"}
        >
          {p2Name} · {p2}%
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full">
        <div
          className="bg-gradient-to-r from-lime-500 to-emerald-500 transition-all duration-700"
          style={{ width: `${p1}%` }}
        />
        <div className="flex-1 bg-white/10" />
      </div>
    </div>
  );
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: { player1: true, player2: true, winner: true },
  });

  if (!match) notFound();

  const prediction = await generatePrediction(
    {
      id: match.player1.id,
      name: match.player1.name,
      ranking: match.player1.ranking,
      surfaceWin: match.player1.surfaceWin,
      wonLost: match.player1.wonLost,
      titles: match.player1.titles,
    },
    {
      id: match.player2.id,
      name: match.player2.name,
      ranking: match.player2.ranking,
      surfaceWin: match.player2.surfaceWin,
      wonLost: match.player2.wonLost,
      titles: match.player2.titles,
    },
    match.surface,
  );

  const p1 = match.player1;
  const p2 = match.player2;
  const isCompleted = match.status === "completed";

  return (
    <div className="court-bg grid-bg min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-lime-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to matches
        </Link>

        {/* Match header */}
        <div className="glass-card mb-6 p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-gray-400">
              <MapPin className="h-3 w-3" />
              {match.tournament}
            </span>
            <span className="text-gray-600">·</span>
            <span className="text-gray-500">{match.round}</span>
            <span className="text-gray-600">·</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSurfaceColor(match.surface)}`}
            >
              {match.surface}
            </span>
            <span className="text-gray-600">·</span>
            <span className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-3 w-3" />
              {match.startTime.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Players face-off */}
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Player 1 */}
            <div className="text-center">
              <p className="mb-1 text-3xl">{getCountryFlag(p1.country)}</p>
              <h2 className="text-lg font-bold text-white">{p1.name}</h2>
              <p className="text-sm text-gray-400">
                #{p1.ranking} · {p1.tour}
              </p>
              {p1.wonLost && (
                <p className="mt-1 text-xs text-gray-500">{p1.wonLost} W-L</p>
              )}
            </div>

            {/* VS + probability */}
            <div className="text-center">
              {isCompleted && match.score ? (
                <div>
                  <p className="mb-1 text-xs font-semibold text-emerald-400">
                    FINAL
                  </p>
                  <p className="text-xl font-bold text-white">{match.score}</p>
                  {match.winner && (
                    <p className="mt-1 text-xs text-lime-400">
                      {match.winner.name} wins
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="font-heading text-3xl font-black text-lime-400">
                    {prediction.p1WinPct}
                    <span className="mx-1 text-gray-600">-</span>
                    {prediction.p2WinPct}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">win probability</p>
                </div>
              )}
            </div>

            {/* Player 2 */}
            <div className="text-center">
              <p className="mb-1 text-3xl">{getCountryFlag(p2.country)}</p>
              <h2 className="text-lg font-bold text-white">{p2.name}</h2>
              <p className="text-sm text-gray-400">
                #{p2.ranking} · {p2.tour}
              </p>
              {p2.wonLost && (
                <p className="mt-1 text-xs text-gray-500">{p2.wonLost} W-L</p>
              )}
            </div>
          </div>

          {/* Probability bar */}
          <div className="mt-6 flex h-3 overflow-hidden rounded-full">
            <div
              className="bg-gradient-to-r from-lime-500 to-emerald-500 transition-all duration-700"
              style={{ width: `${prediction.p1WinPct}%` }}
            />
            <div className="flex-1 bg-white/10" />
          </div>
          <div className="mt-1 flex justify-between text-xs text-gray-500">
            <span>
              {p1.name} {prediction.p1WinPct}%
            </span>
            <span>
              {p2.name} {prediction.p2WinPct}%
            </span>
          </div>
        </div>

        {/* AI Prediction */}
        <div className="mb-6">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            AI Prediction Breakdown
          </h3>
          <p className="mb-4 text-sm text-gray-300">
            Our model picks{" "}
            <span className="font-semibold text-lime-400">
              {prediction.favoriteName}
            </span>{" "}
            to win with {prediction.confidence}% confidence.
          </p>
        </div>

        {/* Factor breakdown */}
        <div className="grid gap-3 sm:grid-cols-2">
          <FactorRow
            label={prediction.factors.ranking.label}
            p1={prediction.factors.ranking.p1}
            p2={prediction.factors.ranking.p2}
            p1Name={p1.name.split(" ").pop() || p1.name}
            p2Name={p2.name.split(" ").pop() || p2.name}
          />
          <FactorRow
            label={prediction.factors.surface.label}
            p1={prediction.factors.surface.p1}
            p2={prediction.factors.surface.p2}
            p1Name={p1.name.split(" ").pop() || p1.name}
            p2Name={p2.name.split(" ").pop() || p2.name}
          />
          <FactorRow
            label={prediction.factors.h2h.label}
            p1={prediction.factors.h2h.p1}
            p2={prediction.factors.h2h.p2}
            p1Name={p1.name.split(" ").pop() || p1.name}
            p2Name={p2.name.split(" ").pop() || p2.name}
          />
          <FactorRow
            label={prediction.factors.form.label}
            p1={prediction.factors.form.p1}
            p2={prediction.factors.form.p2}
            p1Name={p1.name.split(" ").pop() || p1.name}
            p2Name={p2.name.split(" ").pop() || p2.name}
          />
        </div>

        {/* Player Stats Comparison */}
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
            Player Comparison
          </h3>
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                    Stat
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-lime-400">
                    {p1.name.split(" ").pop()}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-300">
                    {p2.name.split(" ").pop()}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">Ranking</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-white">
                    #{p1.ranking}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-white">
                    #{p2.ranking}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">Titles</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-white">
                    {p1.titles}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-white">
                    {p2.titles}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-gray-400">Season W-L</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-white">
                    {p1.wonLost || "N/A"}
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-white">
                    {p2.wonLost || "N/A"}
                  </td>
                </tr>
                {p1.age && p2.age && (
                  <tr>
                    <td className="px-4 py-2.5 text-gray-400">Age</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-white">
                      {p1.age}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-white">
                      {p2.age}
                    </td>
                  </tr>
                )}
                {p1.height && p2.height && (
                  <tr>
                    <td className="px-4 py-2.5 text-gray-400">Height</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-white">
                      {p1.height}
                    </td>
                    <td className="px-4 py-2.5 text-center font-semibold text-white">
                      {p2.height}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
