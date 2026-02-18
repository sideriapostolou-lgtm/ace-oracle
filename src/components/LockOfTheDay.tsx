"use client";

import { getCountryFlag } from "@/lib/utils";
import type { PredictionFactors } from "@/lib/predictions";

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

function buildEdgeBullets(
  p1: { id: string; name: string; ranking: number },
  p2: { id: string; name: string; ranking: number },
  surface: string,
  factors: PredictionFactors,
  favoriteId: string,
): string[] {
  const favIsP1 = favoriteId === p1.id;
  const fav = favIsP1 ? p1 : p2;
  const opp = favIsP1 ? p2 : p1;
  const favLast = fav.name.split(" ").pop() ?? fav.name;
  const bullets: string[] = [];

  // Bullet 1: Ranking
  const rankGap = Math.abs(fav.ranking - opp.ranking);
  if (fav.ranking < opp.ranking) {
    if (rankGap > 30) {
      bullets.push(`#${fav.ranking} vs #${opp.ranking} — massive ranking gap`);
    } else if (rankGap > 10) {
      bullets.push(
        `Ranked #${fav.ranking} vs #${opp.ranking} — clear tier above`,
      );
    } else {
      bullets.push(`#${fav.ranking} vs #${opp.ranking} — slight edge on paper`);
    }
  } else if (fav.ranking > opp.ranking) {
    bullets.push(
      `Ranked #${fav.ranking} vs #${opp.ranking} — matchup context overrides ranking`,
    );
  } else {
    bullets.push(`Both ranked #${fav.ranking} — comes down to the details`);
  }

  // Bullet 2: Surface context
  const surfaceLower = surface.toLowerCase();
  if (surfaceLower === "clay") {
    bullets.push(`Clay court — higher upset potential, unpredictable surface`);
  } else if (surfaceLower === "grass") {
    bullets.push(`Grass court — serve-dominant, favors the higher seed`);
  } else {
    bullets.push(`Hard court — neutral surface, ranking advantage holds`);
  }

  // Bullet 3: Round depth
  const roundProb = factors.round_depth.p1;
  if (roundProb <= 45) {
    bullets.push(
      `Deep round — both players battle-tested, tight matchup expected`,
    );
  } else if (roundProb >= 58) {
    bullets.push(`Early round — ${favLast} should advance comfortably`);
  } else {
    bullets.push(`Mid-tournament — quality opponent, ranking matters`);
  }

  return bullets.slice(0, 3);
}

export default function LockOfTheDay({
  player1,
  player2,
  tournament,
  surface,
  round,
  p1WinPct,
  p2WinPct,
  favoriteId,
  favoriteName,
  factors,
}: LockOfTheDayProps) {
  const favorite = favoriteId === player1.id ? player1 : player2;
  const favLast = favoriteName.split(" ").pop() ?? favoriteName;

  const lockWinPct = Math.max(p1WinPct, p2WinPct);
  const confClass = lockWinPct >= 68 ? "" : lockWinPct >= 58 ? "medium" : "low";
  const surfaceClass = `lock-surface-${surface.toLowerCase()}`;
  const surfaceMetaClass = `meta-surface-${surface.toLowerCase()}`;

  const bullets = buildEdgeBullets(
    player1,
    player2,
    surface,
    factors,
    favoriteId,
  );

  return (
    <div className={`lock-section animate-in ${surfaceClass}`}>
      <div className="lock-badge">Lock of the Day</div>

      {/* Matchup with rankings */}
      <div className="lock-matchup">
        {player1.name} (#{player1.ranking}) vs {player2.name} (#
        {player2.ranking}) &middot; {tournament} &middot; {round}
      </div>

      {/* THE PICK */}
      <div className="lock-pick-label">The Pick</div>
      <div className="lock-pick-name">
        {getCountryFlag(favorite.country)} {favLast}
      </div>

      {/* Confidence bar */}
      <div className="confidence-bar">
        <div
          className={`confidence-fill ${confClass}`}
          style={{ width: `${lockWinPct}%` }}
        />
      </div>

      {/* THE EDGE — bullet points */}
      <div className="lock-edge">
        <div className="lock-edge-label">The Edge</div>
        <ul className="lock-edge-list">
          {bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </div>

      {/* Meta stats */}
      <div className="lock-meta">
        <div className="meta-item">
          <div className="meta-value">{lockWinPct}%</div>
          <div className="meta-label">Win Prob</div>
        </div>
        <div className="meta-item">
          <div className={`meta-value ${surfaceMetaClass}`}>{surface}</div>
          <div className="meta-label">Surface</div>
        </div>
      </div>
    </div>
  );
}
