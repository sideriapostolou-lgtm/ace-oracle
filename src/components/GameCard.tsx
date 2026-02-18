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

function getConfidenceLevel(
  p1WinPct: number,
  p2WinPct: number,
): "high" | "medium" | "low" {
  const winPct = Math.max(p1WinPct, p2WinPct);
  if (winPct >= 68) return "high";
  if (winPct >= 58) return "medium";
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

export default function GameCard({
  player1,
  player2,
  tournament,
  round,
  surface,
  startTime,
  tour,
  p1WinPct,
  p2WinPct,
  favoriteId,
  favoriteName,
  factors,
}: GameCardProps) {
  const confLevel = getConfidenceLevel(p1WinPct, p2WinPct);
  const winPct = Math.max(p1WinPct, p2WinPct);
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
        <span className={`pick-conf ${confLevel}`}>{winPct}%</span>
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
