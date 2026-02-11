import { h2hData } from "./tennis-data";

interface PlayerData {
  id: string;
  name: string;
  ranking: number;
  surfaceWin: string | null;
  wonLost: string | null;
  titles: number;
}

export interface PredictionFactors {
  ranking: { p1: number; p2: number; label: string };
  surface: { p1: number; p2: number; label: string };
  h2h: { p1: number; p2: number; label: string };
  form: { p1: number; p2: number; label: string };
}

export interface MatchPrediction {
  favoriteId: string;
  favoriteName: string;
  p1WinPct: number;
  p2WinPct: number;
  confidence: number;
  factors: PredictionFactors;
}

function getWinRate(wonLost: string | null): number {
  if (!wonLost) return 0.5;
  const parts = wonLost.split("-");
  const wins = parseInt(parts[0], 10);
  const losses = parseInt(parts[1], 10);
  if (wins + losses === 0) return 0.5;
  return wins / (wins + losses);
}

function getSurfaceRate(surfaceWin: string | null, surface: string): number {
  if (!surfaceWin) return 0.5;
  try {
    const rates = JSON.parse(surfaceWin) as Record<string, number>;
    const key = surface.toLowerCase();
    return rates[key] ?? 0.5;
  } catch {
    return 0.5;
  }
}

function findH2H(
  p1Name: string,
  p2Name: string,
): { p1Wins: number; p2Wins: number } | null {
  const direct = h2hData.find((h) => h.p1 === p1Name && h.p2 === p2Name);
  if (direct) return { p1Wins: direct.p1Wins, p2Wins: direct.p2Wins };

  const reversed = h2hData.find((h) => h.p1 === p2Name && h.p2 === p1Name);
  if (reversed) return { p1Wins: reversed.p2Wins, p2Wins: reversed.p1Wins };

  return null;
}

export function generatePrediction(
  p1: PlayerData,
  p2: PlayerData,
  surface: string,
): MatchPrediction {
  // Factor 1: Ranking (40% weight)
  const rankDiff = p2.ranking - p1.ranking;
  const rankProb = 1 / (1 + Math.pow(10, -rankDiff / 250));
  const rankPct1 = Math.round(rankProb * 100);

  // Factor 2: Surface (25% weight)
  const s1 = getSurfaceRate(p1.surfaceWin, surface);
  const s2 = getSurfaceRate(p2.surfaceWin, surface);
  const surfaceTotal = s1 + s2;
  const surfaceProb = surfaceTotal > 0 ? s1 / surfaceTotal : 0.5;
  const surfPct1 = Math.round(surfaceProb * 100);

  // Factor 3: Head-to-Head (20% weight)
  const h2h = findH2H(p1.name, p2.name);
  let h2hProb = 0.5;
  if (h2h && h2h.p1Wins + h2h.p2Wins > 0) {
    h2hProb = h2h.p1Wins / (h2h.p1Wins + h2h.p2Wins);
  }
  const h2hPct1 = Math.round(h2hProb * 100);

  // Factor 4: Form / Win Rate (15% weight)
  const form1 = getWinRate(p1.wonLost);
  const form2 = getWinRate(p2.wonLost);
  const formTotal = form1 + form2;
  const formProb = formTotal > 0 ? form1 / formTotal : 0.5;
  const formPct1 = Math.round(formProb * 100);

  // Weighted combination
  const combined =
    rankProb * 0.4 + surfaceProb * 0.25 + h2hProb * 0.2 + formProb * 0.15;

  // Clamp 5-95%
  const p1Final = Math.min(0.95, Math.max(0.05, combined));
  const p1WinPct = Math.round(p1Final * 100);
  const p2WinPct = 100 - p1WinPct;

  // Confidence is how far from 50/50 the prediction is
  const confidence = Math.abs(p1WinPct - 50) + 50;

  const favoriteId = p1WinPct >= p2WinPct ? p1.id : p2.id;
  const favoriteName = p1WinPct >= p2WinPct ? p1.name : p2.name;

  return {
    favoriteId,
    favoriteName,
    p1WinPct,
    p2WinPct,
    confidence,
    factors: {
      ranking: {
        p1: rankPct1,
        p2: 100 - rankPct1,
        label: "Ranking",
      },
      surface: {
        p1: surfPct1,
        p2: 100 - surfPct1,
        label: `${surface} Record`,
      },
      h2h: {
        p1: h2hPct1,
        p2: 100 - h2hPct1,
        label: h2h ? `H2H (${h2h.p1Wins}-${h2h.p2Wins})` : "H2H (No Data)",
      },
      form: {
        p1: formPct1,
        p2: 100 - formPct1,
        label: "Season Form",
      },
    },
  };
}
