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
  const oppLast = opp.name.split(" ").pop() ?? opp.name;
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
      `Ranked #${fav.ranking} vs #${opp.ranking} — form and matchup override ranking`,
    );
  } else {
    bullets.push(`Both ranked #${fav.ranking} — comes down to the details`);
  }

  // Bullet 2: Surface
  const favSurf = favIsP1 ? factors.surface.p1 : factors.surface.p2;
  const oppSurf = favIsP1 ? factors.surface.p2 : factors.surface.p1;
  if (favSurf > oppSurf + 10) {
    bullets.push(
      `${favLast} dominates on ${surface.toLowerCase()} — ${favSurf}% vs ${oppSurf}%`,
    );
  } else if (favSurf > oppSurf) {
    bullets.push(
      `${surface} court favors ${favLast} (${favSurf}% vs ${oppSurf}%)`,
    );
  } else if (favSurf < oppSurf) {
    bullets.push(
      `${oppLast} has the ${surface.toLowerCase()} edge but ranking + form compensate`,
    );
  } else {
    bullets.push(
      `Even ${surface.toLowerCase()} records — other factors decide this`,
    );
  }

  // Bullet 3: H2H or Form
  if (!factors.h2h.label.includes("No Data")) {
    const favH2H = favIsP1 ? factors.h2h.p1 : factors.h2h.p2;
    if (favH2H >= 65) {
      bullets.push(`Owns the head-to-head: ${factors.h2h.label}`);
    } else if (favH2H >= 50) {
      bullets.push(`Leads head-to-head: ${factors.h2h.label}`);
    } else {
      bullets.push(
        `Trails ${factors.h2h.label} H2H but current form is superior`,
      );
    }
  } else {
    const favForm = favIsP1 ? factors.form.p1 : factors.form.p2;
    const oppForm = favIsP1 ? factors.form.p2 : factors.form.p1;
    if (favForm > 65) {
      bullets.push(`${favLast} in peak form — ${favForm}% season win rate`);
    } else if (favForm > oppForm + 10) {
      bullets.push(
        `Better current form: ${favLast} ${favForm}% vs ${oppLast} ${oppForm}%`,
      );
    } else if (favForm > 55) {
      bullets.push(`Solid season form (${favForm}%) tips the balance`);
    } else {
      bullets.push(
        `Tight matchup — ranking and surface give ${favLast} the edge`,
      );
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
