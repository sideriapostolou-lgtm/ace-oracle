import { h2hData } from "./tennis-data";
import {
  getLearnedWeights,
  DEFAULT_WEIGHTS,
  getDynamicH2H,
  loadMemory,
} from "./learning-engine";

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

/** Map round names to fatigue scores (deeper rounds = more tired) */
const ROUND_FATIGUE: Record<string, number> = {
  "Round of 128": 0,
  "Round of 64": 0.02,
  "Round of 32": 0.04,
  "Round of 16": 0.06,
  Quarterfinals: 0.08,
  Semifinals: 0.1,
  Final: 0.12,
  "1st Round": 0,
  "2nd Round": 0.02,
  "3rd Round": 0.04,
  "4th Round": 0.06,
};

function getRoundFatigue(round: string): number {
  if (!round) return 0;
  // Try exact match first, then partial match
  if (ROUND_FATIGUE[round] !== undefined) return ROUND_FATIGUE[round];
  const lower = round.toLowerCase();
  for (const [key, val] of Object.entries(ROUND_FATIGUE)) {
    if (lower.includes(key.toLowerCase())) return val;
  }
  return 0.03; // default for unknown rounds
}

export async function generatePrediction(
  p1: PlayerData,
  p2: PlayerData,
  surface: string,
  round?: string,
): Promise<MatchPrediction> {
  // Load learned weights (or defaults)
  let w: Record<string, number>;
  try {
    w = getLearnedWeights();
  } catch {
    w = { ...DEFAULT_WEIGHTS };
  }

  // Factor 1: Ranking
  const rankDiff = p2.ranking - p1.ranking;
  const rankProb = 1 / (1 + Math.pow(10, -rankDiff / 100));
  const rankPct1 = Math.round(rankProb * 100);

  // Factor 2: Surface
  const s1 = getSurfaceRate(p1.surfaceWin, surface);
  const s2 = getSurfaceRate(p2.surfaceWin, surface);
  const surfaceTotal = s1 + s2;
  const surfaceProb = surfaceTotal > 0 ? s1 / surfaceTotal : 0.5;
  const surfPct1 = Math.round(surfaceProb * 100);

  // Factor 3: Head-to-Head (blend static + dynamic)
  const staticH2H = findH2H(p1.name, p2.name);
  let h2hProb = 0.5;
  let h2hLabel = "H2H (No Data)";

  // Try dynamic H2H from learning engine
  let dynamicH2H: { p1Wins: number; p2Wins: number } | null = null;
  try {
    const mem = await loadMemory();
    const dyn = getDynamicH2H(p1.name, p2.name, mem);
    if (dyn && dyn.p1Wins + dyn.p2Wins > 0) {
      dynamicH2H = dyn;
    }
  } catch {
    // KV not available, skip dynamic H2H
  }

  if (dynamicH2H && staticH2H) {
    // Blend: 60% dynamic (recent) + 40% static (historical)
    const dynTotal = dynamicH2H.p1Wins + dynamicH2H.p2Wins;
    const statTotal = staticH2H.p1Wins + staticH2H.p2Wins;
    const dynProb = dynamicH2H.p1Wins / dynTotal;
    const statProb = staticH2H.p1Wins / statTotal;
    h2hProb = dynProb * 0.6 + statProb * 0.4;
    const totalW = dynamicH2H.p1Wins + staticH2H.p1Wins;
    const totalL = dynamicH2H.p2Wins + staticH2H.p2Wins;
    h2hLabel = `H2H (${totalW}-${totalL})`;
  } else if (dynamicH2H) {
    h2hProb = dynamicH2H.p1Wins / (dynamicH2H.p1Wins + dynamicH2H.p2Wins);
    h2hLabel = `H2H (${dynamicH2H.p1Wins}-${dynamicH2H.p2Wins})`;
  } else if (staticH2H && staticH2H.p1Wins + staticH2H.p2Wins > 0) {
    h2hProb = staticH2H.p1Wins / (staticH2H.p1Wins + staticH2H.p2Wins);
    h2hLabel = `H2H (${staticH2H.p1Wins}-${staticH2H.p2Wins})`;
  }
  const h2hPct1 = Math.round(h2hProb * 100);

  // Factor 4: Form / Win Rate
  const form1 = getWinRate(p1.wonLost);
  const form2 = getWinRate(p2.wonLost);
  const formTotal = form1 + form2;
  const formProb = formTotal > 0 ? form1 / formTotal : 0.5;
  const formPct1 = Math.round(formProb * 100);

  // Factor 5: Round Fatigue — deeper rounds favor higher-ranked players
  const fatiguePenalty = getRoundFatigue(round || "");
  // Higher-ranked player (lower number) is more conditioned for deep runs
  // Apply a small boost to the favorite based on tournament depth
  const rankAdvantage = p1.ranking < p2.ranking ? 1 : -1;
  const fatigueProb = 0.5 + rankAdvantage * fatiguePenalty;

  // Weighted combination using learned weights
  const combined =
    rankProb * (w.ranking ?? 0.3) +
    surfaceProb * (w.surface ?? 0.2) +
    h2hProb * (w.h2h ?? 0.2) +
    formProb * (w.form ?? 0.2) +
    fatigueProb * (w.fatigue ?? 0.1);

  // Amplify distance from 50% for more decisive predictions
  const amplified = 0.5 + (combined - 0.5) * 1.6;

  // Clamp 15-85% (wider range, still reasonable)
  const p1Final = Math.min(0.85, Math.max(0.15, amplified));
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
        label: h2hLabel,
      },
      form: {
        p1: formPct1,
        p2: 100 - formPct1,
        label: "Season Form",
      },
    },
  };
}
