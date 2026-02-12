"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import GameCard from "./GameCard";
import LockOfTheDay from "./LockOfTheDay";
import type { PredictionFactors } from "@/lib/predictions";

export interface MatchWithPrediction {
  id: string;
  tournament: string;
  round: string;
  surface: string;
  startTime: string;
  tour: string;
  player1: {
    id: string;
    name: string;
    country: string;
    ranking: number;
  };
  player2: {
    id: string;
    name: string;
    country: string;
    ranking: number;
  };
  p1WinPct: number;
  p2WinPct: number;
  confidence: number;
  favoriteId: string;
  favoriteName: string;
  factors: PredictionFactors;
}

interface DashboardClientProps {
  matches: MatchWithPrediction[];
  lockOfDay: MatchWithPrediction | null;
  userPicks: Record<string, string>;
}

export default function DashboardClient({
  matches,
  lockOfDay,
  userPicks: initialPicks,
}: DashboardClientProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [picks, setPicks] = useState<Record<string, string>>(initialPicks);
  const [loadingMatch, setLoadingMatch] = useState<string | null>(null);

  async function handlePick(matchId: string, playerId: string): Promise<void> {
    if (!session) {
      router.push("/login");
      return;
    }

    if (picks[matchId] === playerId) return;

    setLoadingMatch(matchId);
    try {
      const res = await fetch("/api/picks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, pickedPlayerId: playerId }),
      });

      if (res.ok) {
        setPicks((prev) => ({ ...prev, [matchId]: playerId }));
      }
    } finally {
      setLoadingMatch(null);
    }
  }

  return (
    <>
      {/* Lock of the Day */}
      {lockOfDay && (
        <LockOfTheDay
          matchId={lockOfDay.id}
          player1={lockOfDay.player1}
          player2={lockOfDay.player2}
          tournament={lockOfDay.tournament}
          surface={lockOfDay.surface}
          round={lockOfDay.round}
          p1WinPct={lockOfDay.p1WinPct}
          p2WinPct={lockOfDay.p2WinPct}
          favoriteId={lockOfDay.favoriteId}
          favoriteName={lockOfDay.favoriteName}
          confidence={lockOfDay.confidence}
          factors={lockOfDay.factors}
          pickedPlayerId={picks[lockOfDay.id]}
          onPick={handlePick}
        />
      )}

      {/* Divider */}
      {lockOfDay && matches.length > 0 && (
        <div className="net-divider">
          <div className="net-divider-icon" />
        </div>
      )}

      {/* All Other Matches */}
      {matches.length > 0 ? (
        <>
          <div className="section-label">Today&apos;s Picks</div>
          <div className="stagger">
            {matches.map((match) => (
              <GameCard
                key={match.id}
                matchId={match.id}
                player1={match.player1}
                player2={match.player2}
                tournament={match.tournament}
                round={match.round}
                surface={match.surface}
                startTime={match.startTime}
                tour={match.tour}
                p1WinPct={match.p1WinPct}
                p2WinPct={match.p2WinPct}
                confidence={match.confidence}
                favoriteId={match.favoriteId}
                favoriteName={match.favoriteName}
                factors={match.factors}
                pickedPlayerId={picks[match.id]}
                onPick={handlePick}
                isPickLoading={loadingMatch === match.id}
              />
            ))}
          </div>
        </>
      ) : !lockOfDay ? (
        <div className="no-matches">
          <h3>No matches scheduled</h3>
          <p>Check back tomorrow for fresh picks.</p>
        </div>
      ) : null}
    </>
  );
}
