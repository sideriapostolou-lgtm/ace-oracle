import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";

const MEMORY_FILE = path.join(process.cwd(), "data", "prediction_memory.json");
const KV_KEY = "prediction_memory";
const LEARNING_RATE = 0.1;
const MIN_PREDICTIONS_FOR_LEARNING = 5;
const MIN_PREDICTIONS_FOR_PATTERNS = 10;

function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export const DEFAULT_WEIGHTS: Record<string, number> = {
  ranking: 0.3,
  surface: 0.2,
  h2h: 0.2,
  form: 0.2,
  fatigue: 0.1,
};

export interface FactorAccuracy {
  correct: number;
  total: number;
  accuracy: number;
}

export interface PredictionEntry {
  matchId: string;
  date: string;
  player1: string;
  player2: string;
  predictedWinner: string;
  confidence: number;
  factors: Record<string, { favored: string }>;
  result: string | null;
  actualWinner: string | null;
  correct: boolean | null;
}

export interface PredictionMemory {
  predictions: PredictionEntry[];
  factorAccuracy: Record<string, FactorAccuracy>;
  learnedWeights: Record<string, number>;
  patterns: string[];
  totalPredictions: number;
  totalCorrect: number;
  accuracy: number;
  lastWeightUpdate: string | null;
}

function emptyMemory(): PredictionMemory {
  return {
    predictions: [],
    factorAccuracy: {
      ranking: { correct: 0, total: 0, accuracy: 0 },
      surface: { correct: 0, total: 0, accuracy: 0 },
      h2h: { correct: 0, total: 0, accuracy: 0 },
      form: { correct: 0, total: 0, accuracy: 0 },
      fatigue: { correct: 0, total: 0, accuracy: 0 },
    },
    learnedWeights: { ...DEFAULT_WEIGHTS },
    patterns: [],
    totalPredictions: 0,
    totalCorrect: 0,
    accuracy: 0,
    lastWeightUpdate: null,
  };
}

export async function loadPredictionMemoryFromKv(): Promise<PredictionMemory | null> {
  if (!isKvAvailable()) return null;
  try {
    const data = await kv.get<PredictionMemory>(KV_KEY);
    return data ?? null;
  } catch {
    return null;
  }
}

export function loadPredictionMemory(): PredictionMemory {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
      return JSON.parse(raw) as PredictionMemory;
    }
  } catch {
    // ignore
  }
  return emptyMemory();
}

export async function loadMemory(): Promise<PredictionMemory> {
  const kvData = await loadPredictionMemoryFromKv();
  if (kvData) return kvData;
  return loadPredictionMemory();
}

export function getLearnedWeights(): Record<string, number> {
  const mem = loadPredictionMemory();
  return mem.learnedWeights ?? { ...DEFAULT_WEIGHTS };
}

export function recordLearningPrediction(
  matchId: string,
  date: string,
  player1: string,
  player2: string,
  predictedWinner: string,
  confidence: number,
  factors: Record<string, { favored: string }>,
): void {
  const mem = loadPredictionMemory();
  if (mem.predictions.some((p) => p.matchId === matchId)) return;
  mem.predictions.push({
    matchId,
    date,
    player1,
    player2,
    predictedWinner,
    confidence,
    factors,
    result: null,
    actualWinner: null,
    correct: null,
  });
  mem.totalPredictions = mem.predictions.length;
  savePredictionMemory(mem);
}

export async function recordPredictionAsync(
  matchId: string,
  date: string,
  player1: string,
  player2: string,
  predictedWinner: string,
  confidence: number,
  factors: Record<string, { favored: string }>,
): Promise<void> {
  const mem = await loadMemory();
  if (mem.predictions.some((p) => p.matchId === matchId)) return;
  mem.predictions.push({
    matchId,
    date,
    player1,
    player2,
    predictedWinner,
    confidence,
    factors,
    result: null,
    actualWinner: null,
    correct: null,
  });
  mem.totalPredictions = mem.predictions.length;
  await saveMemory(mem);
}

export async function saveMemoryToKv(data: PredictionMemory): Promise<boolean> {
  if (!isKvAvailable()) return false;
  try {
    await kv.set(KV_KEY, data);
    return true;
  } catch {
    return false;
  }
}

function saveMemoryToFile(data: PredictionMemory): void {
  try {
    const dir = path.dirname(MEMORY_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const tmp = MEMORY_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, MEMORY_FILE);
  } catch {
    // Vercel runtime is read-only — expected in production
  }
}

export function savePredictionMemory(data: PredictionMemory): void {
  saveMemoryToFile(data);
}

export async function saveMemory(data: PredictionMemory): Promise<void> {
  const kvSaved = await saveMemoryToKv(data);
  if (!kvSaved) {
    saveMemoryToFile(data);
  }
}

function applyResolution(
  mem: PredictionMemory,
  matchId: string,
  actualWinner: string,
  score: string,
): boolean {
  const pred = mem.predictions.find(
    (p) => p.matchId === matchId && p.result === null,
  );
  if (!pred) return false;

  pred.result = score;
  pred.actualWinner = actualWinner;
  pred.correct = pred.predictedWinner === actualWinner;

  // Update factor accuracy
  for (const [factorName, factorData] of Object.entries(pred.factors)) {
    if (factorName in mem.factorAccuracy) {
      const fa = mem.factorAccuracy[factorName];
      fa.total += 1;
      if (factorData.favored === actualWinner) {
        fa.correct += 1;
      }
      fa.accuracy =
        fa.total > 0 ? Math.round((fa.correct / fa.total) * 1000) / 10 : 0;
    }
  }

  // Update totals
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  mem.totalCorrect = resolved.filter((p) => p.correct).length;
  mem.accuracy =
    resolved.length > 0
      ? Math.round((mem.totalCorrect / resolved.length) * 1000) / 10
      : 0;

  if (resolved.length >= MIN_PREDICTIONS_FOR_LEARNING) {
    adjustWeights(mem);
  }
  if (resolved.length >= MIN_PREDICTIONS_FOR_PATTERNS) {
    detectPatterns(mem);
  }

  return true;
}

export async function resolveResultAsync(
  matchId: string,
  actualWinner: string,
  score: string,
): Promise<boolean> {
  const mem = await loadMemory();
  if (!applyResolution(mem, matchId, actualWinner, score)) return false;
  await saveMemory(mem);
  return true;
}

export function resolveResult(
  matchId: string,
  actualWinner: string,
  score: string,
): boolean {
  const mem = loadPredictionMemory();
  if (!applyResolution(mem, matchId, actualWinner, score)) return false;
  savePredictionMemory(mem);
  return true;
}

/**
 * Tennis season state detection.
 * Returns: "active", "offseason", or "preseason"
 */
export function getTennisSeasonState(): "active" | "offseason" | "preseason" {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  // Early January: Australian Open buildup
  if (month === 1 && day < 8) return "preseason";

  // Late November through December: offseason (after ATP Finals)
  if (month === 12 || (month === 11 && day > 24)) return "offseason";

  // Everything else: active tennis season
  return "active";
}

export interface LearningStats {
  totalPredictions: number;
  totalResolved: number;
  totalCorrect: number;
  accuracy: number;
  patterns: string[];
  patternCount: number;
  weights: { name: string; pct: number }[];
  lastUpdate: string | null;
}

const FACTOR_LABELS: Record<string, string> = {
  ranking: "Rankings",
  surface: "Surface",
  h2h: "Head-to-Head",
  form: "Form",
  fatigue: "Fatigue",
};

export function getLearningStats(): LearningStats {
  const mem = loadPredictionMemory();
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  const weights = mem.learnedWeights ?? { ...DEFAULT_WEIGHTS };

  const sortedWeights = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({
      name: FACTOR_LABELS[k] ?? k,
      pct: Math.round(v * 1000) / 10,
    }));

  return {
    totalPredictions: mem.totalPredictions ?? 0,
    totalResolved: resolved.length,
    totalCorrect: mem.totalCorrect ?? 0,
    accuracy: mem.accuracy ?? 0,
    patterns: mem.patterns ?? [],
    patternCount: (mem.patterns ?? []).length,
    weights: sortedWeights,
    lastUpdate: mem.lastWeightUpdate ?? null,
  };
}

export async function getLearningStatsAsync(): Promise<LearningStats> {
  const mem = await loadMemory();
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  const weights = mem.learnedWeights ?? { ...DEFAULT_WEIGHTS };

  const sortedWeights = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({
      name: FACTOR_LABELS[k] ?? k,
      pct: Math.round(v * 1000) / 10,
    }));

  return {
    totalPredictions: mem.totalPredictions ?? 0,
    totalResolved: resolved.length,
    totalCorrect: mem.totalCorrect ?? 0,
    accuracy: mem.accuracy ?? 0,
    patterns: mem.patterns ?? [],
    patternCount: (mem.patterns ?? []).length,
    weights: sortedWeights,
    lastUpdate: mem.lastWeightUpdate ?? null,
  };
}

export async function getLearnedWeightsAsync(): Promise<
  Record<string, number>
> {
  const mem = await loadMemory();
  return mem.learnedWeights ?? { ...DEFAULT_WEIGHTS };
}

function adjustWeights(mem: PredictionMemory): void {
  const overallAcc = mem.accuracy;
  const weights = mem.learnedWeights;

  for (const factor of Object.keys(weights)) {
    if (factor in mem.factorAccuracy && mem.factorAccuracy[factor].total > 0) {
      const factorAcc = mem.factorAccuracy[factor].accuracy;
      const adjustment = 1 + ((factorAcc - overallAcc) / 100.0) * LEARNING_RATE;
      weights[factor] = weights[factor] * adjustment;
    }
  }

  // Normalize
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const k of Object.keys(weights)) {
      weights[k] = Math.round((weights[k] / total) * 10000) / 10000;
    }
  }

  mem.learnedWeights = weights;
  mem.lastWeightUpdate = new Date().toISOString();
}

function detectPatterns(mem: PredictionMemory): void {
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  if (resolved.length < MIN_PREDICTIONS_FOR_PATTERNS) return;

  const patterns: string[] = [];

  // Higher-ranked player win rate
  const rankFavWins = resolved.filter(
    (p) => p.factors.ranking?.favored === p.actualWinner,
  ).length;
  const rankPct = Math.round((rankFavWins / resolved.length) * 1000) / 10;
  patterns.push(
    `Higher-ranked player wins ${rankPct}% of the time (${rankFavWins}/${resolved.length})`,
  );

  // High confidence hit rate
  const highConf = resolved.filter((p) => p.confidence > 70);
  if (highConf.length > 0) {
    const highCorrect = highConf.filter((p) => p.correct).length;
    const highPct = Math.round((highCorrect / highConf.length) * 1000) / 10;
    patterns.push(
      `High-confidence picks (>70%) hit ${highPct}% (${highCorrect}/${highConf.length})`,
    );
  }

  // Best factor
  const sorted = Object.entries(mem.factorAccuracy)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].accuracy - a[1].accuracy);
  if (sorted.length > 0) {
    const [name, data] = sorted[0];
    const label =
      name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, " ");
    patterns.push(
      `Most reliable factor: ${label} (${data.accuracy}% accurate)`,
    );
  }

  mem.patterns = patterns;
}
