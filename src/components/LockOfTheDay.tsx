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
  const bullets: string[] = [];

  if (fav.ranking < opp.ranking) {
    bullets.push(
      `Ranked #${fav.ranking} vs #${opp.ranking} — clear ranking edge`,
    );
  } else if (fav.ranking > opp.ranking) {
    bullets.push(
      `Ranked #${fav.ranking} vs #${opp.ranking} — other factors compensate`,
    );
  } else {
    bullets.push(`Both ranked #${fav.ranking} — evenly matched on paper`);
  }

  const favSurf = favIsP1 ? factors.surface.p1 : factors.surface.p2;
  const oppSurf = favIsP1 ? factors.surface.p2 : factors.surface.p1;
  if (favSurf > oppSurf) {
    bullets.push(
      `${favSurf}% ${surface.toLowerCase()} court factor vs ${oppSurf}%`,
    );
  } else if (favSurf < oppSurf) {
    bullets.push(
      `${surface} court slight disadvantage — offset by other metrics`,
    );
  }

  if (!factors.h2h.label.includes("No Data")) {
    const favH2H = favIsP1 ? factors.h2h.p1 : factors.h2h.p2;
    if (favH2H >= 50) {
      bullets.push(`Favorable head-to-head: ${factors.h2h.label}`);
    } else {
      bullets.push(`${factors.h2h.label} — trails H2H but form favors`);
    }
  }

  if (bullets.length < 3) {
    const favForm = favIsP1 ? factors.form.p1 : factors.form.p2;
    if (favForm > 55) {
      bullets.push(`Strong current form — ${favForm}% season edge`);
    } else {
      bullets.push(`Comparable form — composite model gives the nod`);
    }
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
  confidence,
  factors,
}: LockOfTheDayProps) {
  const favorite = favoriteId === player1.id ? player1 : player2;
  const favLast = favoriteName.split(" ").pop() ?? favoriteName;

  const confClass = confidence >= 70 ? "" : confidence >= 55 ? "medium" : "low";
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
          style={{ width: `${confidence}%` }}
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
          <div className="meta-value">{confidence}%</div>
          <div className="meta-label">Confidence</div>
        </div>
        <div className="meta-item">
          <div className="meta-value">{Math.max(p1WinPct, p2WinPct)}%</div>
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
