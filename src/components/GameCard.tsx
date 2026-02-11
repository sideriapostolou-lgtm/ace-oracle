"use client";

import { useState } from "react";
import Link from "next/link";
import { cn, getCountryFlag, getSurfaceColor } from "@/lib/utils";
import type { PredictionFactors } from "@/lib/predictions";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Player {
  id: string;
  name: string;
  country: string;
  ranking: number;
}

interface GameCardProps {
  matchId: string;
  player1: Player;
  player2: Player;
  tournament: string;
  round: string;
  surface: string;
  startTime: string;
  tour: string;
  p1WinPct: number;
  p2WinPct: number;
  factors: PredictionFactors;
  pickedPlayerId?: string | null;
  onPick?: (matchId: string, playerId: string) => void;
  isPickLoading?: boolean;
}

function formatMatchTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMatchDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FactorBar({
  label,
  p1,
  p2,
}: {
  label: string;
  p1: number;
  p2: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>
          {p1}% — {p2}%
        </span>
      </div>
      <div className="factor-bar">
        <div
          className="factor-bar-fill bg-gradient-to-r from-lime-500 to-emerald-500"
          style={{ width: `${p1}%` }}
        />
      </div>
    </div>
  );
}

export default function GameCard({
  matchId,
  player1,
  player2,
  tournament,
  round,
  surface,
  startTime,
  tour,
  p1WinPct,
  p2WinPct,
  factors,
  pickedPlayerId,
  onPick,
  isPickLoading,
}: GameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const favorite = p1WinPct >= p2WinPct ? "p1" : "p2";

  return (
    <div className="glass-card overflow-hidden p-0 transition-all duration-300">
      {/* Header: Tournament + Surface + Time */}
      <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            {tournament}
          </span>
          <span className="text-gray-600">·</span>
          <span className="text-xs text-gray-500">{round}</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              getSurfaceColor(surface),
            )}
          >
            {surface}
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
              tour === "Grand Slam"
                ? "bg-yellow-500/20 text-yellow-400"
                : tour === "WTA"
                  ? "bg-pink-500/20 text-pink-400"
                  : "bg-blue-500/20 text-blue-400",
            )}
          >
            {tour}
          </span>
        </div>
      </div>

      {/* Players + Predictions */}
      <div className="px-4 py-4">
        {/* Player 1 Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getCountryFlag(player1.country)}</span>
            <div>
              <Link
                href={`/match/${matchId}`}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-lime-300",
                  favorite === "p1" ? "text-white" : "text-gray-300",
                )}
              >
                {player1.name}
              </Link>
              <p className="text-[11px] text-gray-500">#{player1.ranking}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                favorite === "p1" ? "text-lime-400" : "text-gray-400",
              )}
            >
              {p1WinPct}%
            </span>
            <button
              onClick={() => onPick?.(matchId, player1.id)}
              disabled={isPickLoading}
              className={cn(
                "pick-btn rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                pickedPlayerId === player1.id
                  ? "picked border-lime-500/50"
                  : "border-white/10 text-gray-300 hover:border-lime-500/30 hover:text-lime-300",
              )}
            >
              {pickedPlayerId === player1.id ? "Picked" : "Pick"}
            </button>
          </div>
        </div>

        {/* VS divider */}
        <div className="my-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/5" />
          <span className="text-[10px] font-bold text-gray-600">VS</span>
          <div className="h-px flex-1 bg-white/5" />
        </div>

        {/* Player 2 Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getCountryFlag(player2.country)}</span>
            <div>
              <Link
                href={`/match/${matchId}`}
                className={cn(
                  "text-sm font-semibold transition-colors hover:text-lime-300",
                  favorite === "p2" ? "text-white" : "text-gray-300",
                )}
              >
                {player2.name}
              </Link>
              <p className="text-[11px] text-gray-500">#{player2.ranking}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-sm font-bold tabular-nums",
                favorite === "p2" ? "text-lime-400" : "text-gray-400",
              )}
            >
              {p2WinPct}%
            </span>
            <button
              onClick={() => onPick?.(matchId, player2.id)}
              disabled={isPickLoading}
              className={cn(
                "pick-btn rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all",
                pickedPlayerId === player2.id
                  ? "picked border-lime-500/50"
                  : "border-white/10 text-gray-300 hover:border-lime-500/30 hover:text-lime-300",
              )}
            >
              {pickedPlayerId === player2.id ? "Picked" : "Pick"}
            </button>
          </div>
        </div>
      </div>

      {/* Win probability bar */}
      <div className="mx-4 mb-3 flex h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-gradient-to-r from-lime-500 to-emerald-500 transition-all duration-500"
          style={{ width: `${p1WinPct}%` }}
        />
        <div className="flex-1 bg-white/10" />
      </div>

      {/* Time + Expand toggle */}
      <div className="flex items-center justify-between border-t border-white/5 px-4 py-2">
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
          <Clock className="h-3 w-3" />
          <span>
            {formatMatchDate(startTime)} · {formatMatchTime(startTime)}
          </span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] font-medium text-gray-400 transition-colors hover:text-lime-300"
        >
          {expanded ? "Hide" : "Factors"}
          {expanded ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Expandable Factors */}
      {expanded && (
        <div className="space-y-3 border-t border-white/5 px-4 py-3">
          <FactorBar
            label={factors.ranking.label}
            p1={factors.ranking.p1}
            p2={factors.ranking.p2}
          />
          <FactorBar
            label={factors.surface.label}
            p1={factors.surface.p1}
            p2={factors.surface.p2}
          />
          <FactorBar
            label={factors.h2h.label}
            p1={factors.h2h.p1}
            p2={factors.h2h.p2}
          />
          <FactorBar
            label={factors.form.label}
            p1={factors.form.p1}
            p2={factors.form.p2}
          />
        </div>
      )}
    </div>
  );
}
