"use client";

import { getCountryFlag } from "@/lib/utils";
import type { PredictionFactors } from "@/lib/predictions";

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
  confidence: number;
  favoriteId: string;
  favoriteName: string;
  factors: PredictionFactors;
  pickedPlayerId?: string | null;
  onPick?: (matchId: string, playerId: string) => void;
  isPickLoading?: boolean;
}

function getConfidenceLevel(confidence: number): "high" | "medium" | "low" {
  if (confidence >= 70) return "high";
  if (confidence >= 55) return "medium";
  return "low";
}

function formatMatchTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getSurfaceClass(surface: string): string {
  if (surface === "Hard") return "surface-hard";
  if (surface === "Clay") return "surface-clay";
  return "surface-grass";
}

function buildEdgeBullets(
  p1: Player,
  p2: Player,
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

export default function GameCard({
  player1,
  player2,
  tournament,
  round,
  surface,
  startTime,
  tour,
  confidence,
  favoriteId,
  favoriteName,
  factors,
}: GameCardProps) {
  const confLevel = getConfidenceLevel(confidence);
  const p1Last = player1.name.split(" ").pop() ?? player1.name;
  const p2Last = player2.name.split(" ").pop() ?? player2.name;
  const favLast = favoriteName.split(" ").pop() ?? favoriteName;

  const bullets = buildEdgeBullets(
    player1,
    player2,
    surface,
    factors,
    favoriteId,
  );

  const cardSurfaceClass = `card-${surface.toLowerCase()}`;

  return (
    <div className={`game-card ${cardSurfaceClass}`}>
      {/* Meta line: Tournament · Surface · Round · Tour · Time */}
      <div className="match-meta">
        <span>{tournament}</span>
        <span className="dot">&middot;</span>
        <span className={`surface-tag ${getSurfaceClass(surface)}`}>
          {surface}
        </span>
        <span className="dot">&middot;</span>
        <span>{round}</span>
        <span className="dot">&middot;</span>
        <span>{tour}</span>
        <span className="dot">&middot;</span>
        <span>{formatMatchTime(startTime)}</span>
      </div>

      {/* Matchup with rankings */}
      <div className="matchup">
        <div className="player-side">
          <div className="player-name">
            {getCountryFlag(player1.country)} {p1Last}
          </div>
          <div className="player-rank">#{player1.ranking}</div>
        </div>
        <div className="vs-divider">vs</div>
        <div className="player-side right">
          <div className="player-name">
            {p2Last} {getCountryFlag(player2.country)}
          </div>
          <div className="player-rank">#{player2.ranking}</div>
        </div>
      </div>

      {/* THE PICK */}
      <div className="pick-section">
        <div className="pick-winner">
          <span className="pick-arrow">&rarr;</span>
          <span className="pick-name">{favLast}</span>
        </div>
        <span className={`pick-conf ${confLevel}`}>{confidence}%</span>
      </div>

      {/* THE EDGE — always visible bullets */}
      <div className="edge-section">
        <div className="edge-label">The Edge</div>
        <ul className="edge-bullets">
          {bullets.map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
