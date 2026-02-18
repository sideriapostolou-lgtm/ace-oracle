import { getLearnedWeights, DEFAULT_WEIGHTS } from "./learning-engine";

interface PlayerInput {
  id: string;
  name: string;
  ranking: number;
}

export interface PredictionFactors {
  ranking: { p1: number; p2: number; label: string };
  surface_context: { p1: number; p2: number; label: string };
  round_depth: { p1: number; p2: number; label: string };
  tour_dynamics: { p1: number; p2: number; label: string };
}

export interface MatchPrediction {
  favoriteId: string;
  favoriteName: string;
  p1WinPct: number;
  p2WinPct: number;
  confidence: number;
  factors: PredictionFactors;
}

/**
 * Surface upset adjustment (independent of ranking).
 * Based on real historical upset rates by surface type.
 * Clay has the highest upset rate, grass the lowest.
 */
function getSurfaceAdjustment(surface: string): number {
  const s = surface.toLowerCase();
  if (s === "clay") return -0.06;
  if (s === "grass") return 0.03;
  return 0; // Hard is neutral baseline
}

/**
 * Round depth factor (independent of ranking).
 * Later rounds = both players are quality = harder to predict the favorite.
 * Returns a probability: higher = more predictable (early rounds),
 * lower = less predictable (finals).
 */
const ROUND_DEPTH_MAP: Record<string, number> = {
  "round of 128": 0.6,
  "round of 64": 0.58,
  "round of 32": 0.56,
  "round of 16": 0.54,
  "1st round": 0.58,
  "2nd round": 0.56,
  "3rd round": 0.54,
  "4th round": 0.52,
  quarterfinals: 0.48,
  quarterfinal: 0.48,
  semifinals: 0.45,
  semifinal: 0.45,
  final: 0.42,
};

function getRoundDepth(round: string): number {
  if (!round) return 0.55;
  const lower = round.toLowerCase();
  if (ROUND_DEPTH_MAP[lower] !== undefined) return ROUND_DEPTH_MAP[lower];
  for (const [key, val] of Object.entries(ROUND_DEPTH_MAP)) {
    if (lower.includes(key)) return val;
  }
  return 0.55;
}

/**
 * Tour dynamics (independent of ranking).
 * WTA historically has a higher upset rate than ATP.
 */
function getTourAdjustment(tour: string): number {
  if (tour.toUpperCase() === "WTA") return -0.04;
  return 0; // ATP is baseline
}

/**
 * Generate a prediction using 4 genuinely independent factors:
 * 1. Ranking (ELO-style) - the real signal from ATP/WTA rankings
 * 2. Surface Context - clay/grass/hard upset rates (NOT derived from ranking)
 * 3. Round Depth - later rounds are harder to predict (NOT derived from ranking)
 * 4. Tour Dynamics - WTA vs ATP upset rates (NOT derived from ranking)
 *
 * No amplification. Honest confidence. Clamped to [12%, 88%].
 */
export function generatePrediction(
  p1: PlayerInput,
  p2: PlayerInput,
  surface: string,
  round: string = "",
  tour: string = "ATP",
): MatchPrediction {
  let w: Record<string, number>;
  try {
    w = getLearnedWeights();
  } catch {
    w = { ...DEFAULT_WEIGHTS };
  }

  // Factor 1: Ranking (ELO-style probability)
  const rankDiff = p2.ranking - p1.ranking;
  const rankProb = 1 / (1 + Math.pow(10, -rankDiff / 100));

  // Factor 2: Surface Context (independent of ranking)
  const surfaceAdj = getSurfaceAdjustment(surface);
  const surfaceProb = 0.5 + surfaceAdj;

  // Factor 3: Round Depth (independent of ranking)
  const roundProb = getRoundDepth(round);

  // Factor 4: Tour Dynamics (independent of ranking)
  const tourAdj = getTourAdjustment(tour);
  const tourProb = 0.5 + tourAdj;

  // Weighted combination — NO amplification
  const combined =
    rankProb * (w.ranking ?? 0.4) +
    surfaceProb * (w.surface_context ?? 0.25) +
    roundProb * (w.round_depth ?? 0.2) +
    tourProb * (w.tour_dynamics ?? 0.15);

  // Clamp to [12%, 88%] — honest range
  const p1Final = Math.min(0.88, Math.max(0.12, combined));
  const p1WinPct = Math.round(p1Final * 100);
  const p2WinPct = 100 - p1WinPct;

  // Confidence = pure gap between the two probabilities
  const confidence = Math.abs(p1WinPct - p2WinPct);

  const favoriteId = p1WinPct >= p2WinPct ? p1.id : p2.id;
  const favoriteName = p1WinPct >= p2WinPct ? p1.name : p2.name;

  // Factor percentages for display
  const rankPct1 = Math.round(rankProb * 100);
  const surfacePct1 = Math.round(surfaceProb * 100);
  const roundPct1 = Math.round(roundProb * 100);
  const tourPct1 = Math.round(tourProb * 100);

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
      surface_context: {
        p1: surfacePct1,
        p2: 100 - surfacePct1,
        label: `${surface} Surface`,
      },
      round_depth: {
        p1: roundPct1,
        p2: 100 - roundPct1,
        label: "Round Depth",
      },
      tour_dynamics: {
        p1: tourPct1,
        p2: 100 - tourPct1,
        label: `${tour} Tour`,
      },
    },
  };
}
