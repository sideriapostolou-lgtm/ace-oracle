"use client";

import { cn, getCountryFlag } from "@/lib/utils";
import type { PredictionFactors } from "@/lib/predictions";
import { Lock, TrendingUp } from "lucide-react";

interface LockOfTheDayProps {
  matchId: string;
  player1: { id: string; name: string; country: string; ranking: number };
  player2: { id: string; name: string; country: string; ranking: number };
  tournament: string;
  surface: string;
  round: string;
  p1WinPct: number;
  p2WinPct: number;
  favoriteId: string;
  favoriteName: string;
  confidence: number;
  factors: PredictionFactors;
  pickedPlayerId?: string | null;
  onPick?: (matchId: string, playerId: string) => void;
}

export default function LockOfTheDay({
  matchId,
  player1,
  player2,
  tournament,
  surface,
  round,
  p1WinPct,
  p2WinPct,
  favoriteId,
  favoriteName,
  confidence,
  factors,
  pickedPlayerId,
  onPick,
}: LockOfTheDayProps) {
  const favorite = p1WinPct >= p2WinPct ? player1 : player2;
  const underdog = p1WinPct >= p2WinPct ? player2 : player1;
  const favPct = Math.max(p1WinPct, p2WinPct);

  return (
    <div className="lock-glow lock-glow-animate glass-card relative overflow-hidden border-amber-500/30 p-6">
      {/* Gold accent gradient */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-600/5" />

      <div className="relative">
        {/* Badge */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1">
            <Lock className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">
              LOCK OF THE DAY
            </span>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-lime-500/15 px-2.5 py-1">
            <TrendingUp className="h-3 w-3 text-lime-400" />
            <span className="text-xs font-semibold text-lime-400">
              {confidence}% confidence
            </span>
          </div>
        </div>

        {/* Match Info */}
        <p className="mb-1 text-xs text-gray-400">
          {tournament} · {round} · {surface}
        </p>

        {/* Main Prediction */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-2xl">{getCountryFlag(favorite.country)}</span>
          <div>
            <h3 className="text-lg font-bold text-white">{favoriteName}</h3>
            <p className="text-sm text-gray-400">
              vs {underdog.name}{" "}
              <span className="text-gray-500">(#{underdog.ranking})</span>
            </p>
          </div>
          <div className="ml-auto text-right">
            <p className="font-heading text-3xl font-black text-lime-400">
              {favPct}%
            </p>
            <p className="text-xs text-gray-500">win probability</p>
          </div>
        </div>

        {/* Factor Bars */}
        <div className="mb-4 grid grid-cols-2 gap-x-6 gap-y-2">
          {Object.values(factors).map((factor) => (
            <div key={factor.label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                  {factor.label}
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                  {factor.p1}%
                </span>
              </div>
              <div className="factor-bar">
                <div
                  className="factor-bar-fill bg-gradient-to-r from-amber-500 to-amber-400"
                  style={{ width: `${factor.p1}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Pick Button */}
        <button
          onClick={() => onPick?.(matchId, favoriteId)}
          className={cn(
            "w-full rounded-xl py-3 text-sm font-bold transition-all",
            pickedPlayerId === favoriteId
              ? "bg-gradient-to-r from-amber-500 to-amber-400 text-black"
              : "bg-gradient-to-r from-amber-500/20 to-amber-400/20 text-amber-300 hover:from-amber-500 hover:to-amber-400 hover:text-black",
          )}
        >
          {pickedPlayerId === favoriteId
            ? `Locked: ${favoriteName}`
            : `Lock ${favoriteName} to Win`}
        </button>
      </div>
    </div>
  );
}
