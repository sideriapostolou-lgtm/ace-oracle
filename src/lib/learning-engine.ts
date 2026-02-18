import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";

const MEMORY_FILE = path.join(process.cwd(), "data", "prediction_memory.json");
const KV_KEY = "prediction_memory";
const LEARNING_RATE = 0.1;
const MIN_PREDICTIONS_FOR_LEARNING = 5;
const MIN_PREDICTIONS_FOR_PATTERNS = 10;
const MIN_PREDICTIONS_FOR_CALIBRATION = 30;
const MIN_PREDICTIONS_FOR_UPSETS = 20;

function isKvAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export const DEFAULT_WEIGHTS: Record<string, number> = {
  ranking: 0.4,
  surface_context: 0.25,
  round_depth: 0.2,
  tour_dynamics: 0.15,
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

export interface CalibrationBucket {
  predictedAvg: number;
  actualWinRate: number;
  count: number;
}

export interface RollingWindows {
  last10: { correct: number; total: number; accuracy: number };
  last20: { correct: number; total: number; accuracy: number };
  last50: { correct: number; total: number; accuracy: number };
  history: number[];
}

export interface StreakData {
  current: number;
  longestWin: number;
  longestLoss: number;
}

export interface UpsetLogEntry {
  tag: string;
  upsets: number;
  total: number;
  rate: number;
}

export interface H2HRecord {
  player1: string;
  player2: string;
  p1Wins: number;
  p2Wins: number;
  lastMatch: string;
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
  // V2 fields
  calibration?: {
    buckets: Record<string, CalibrationBucket>;
    lastCalibrated: string | null;
  };
  rollingWindows?: RollingWindows;
  streaks?: StreakData;
  upsetLog?: UpsetLogEntry[];
  h2hResults?: Record<string, H2HRecord>;
  version?: number;
}

function defaultCalibration(): PredictionMemory["calibration"] {
  return { buckets: {}, lastCalibrated: null };
}

function defaultRollingWindows(): RollingWindows {
  return {
    last10: { correct: 0, total: 0, accuracy: 0 },
    last20: { correct: 0, total: 0, accuracy: 0 },
    last50: { correct: 0, total: 0, accuracy: 0 },
    history: [],
  };
}

function defaultStreaks(): StreakData {
  return { current: 0, longestWin: 0, longestLoss: 0 };
}

function ensureV2(mem: PredictionMemory): PredictionMemory {
  if (!mem.calibration) mem.calibration = defaultCalibration();
  if (!mem.rollingWindows) mem.rollingWindows = defaultRollingWindows();
  if (!mem.streaks) mem.streaks = defaultStreaks();
  if (!mem.upsetLog) mem.upsetLog = [];
  if (!mem.h2hResults) mem.h2hResults = {};
  mem.version = 2;
  return mem;
}

export function emptyMemory(): PredictionMemory {
  return ensureV2({
    predictions: [],
    factorAccuracy: {
      ranking: { correct: 0, total: 0, accuracy: 0 },
      surface_context: { correct: 0, total: 0, accuracy: 0 },
      round_depth: { correct: 0, total: 0, accuracy: 0 },
      tour_dynamics: { correct: 0, total: 0, accuracy: 0 },
    },
    learnedWeights: { ...DEFAULT_WEIGHTS },
    patterns: [],
    totalPredictions: 0,
    totalCorrect: 0,
    accuracy: 0,
    lastWeightUpdate: null,
  });
}

export async function loadPredictionMemoryFromKv(): Promise<PredictionMemory | null> {
  if (!isKvAvailable()) return null;
  try {
    const data = await kv.get<PredictionMemory>(KV_KEY);
    return data ? ensureV2(data) : null;
  } catch {
    return null;
  }
}

export function loadPredictionMemory(): PredictionMemory {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const raw = fs.readFileSync(MEMORY_FILE, "utf-8");
      return ensureV2(JSON.parse(raw) as PredictionMemory);
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

// --- V2: Rolling Windows ---

function updateRollingWindows(mem: PredictionMemory, correct: boolean): void {
  const rw = mem.rollingWindows!;
  rw.history.push(correct ? 1 : 0);
  if (rw.history.length > 50) {
    rw.history = rw.history.slice(-50);
  }

  const computeWindow = (
    n: number,
  ): { correct: number; total: number; accuracy: number } => {
    const slice = rw.history.slice(-n);
    const c = slice.reduce((a, b) => a + b, 0);
    return {
      correct: c,
      total: slice.length,
      accuracy:
        slice.length > 0 ? Math.round((c / slice.length) * 1000) / 10 : 0,
    };
  };

  rw.last10 = computeWindow(10);
  rw.last20 = computeWindow(20);
  rw.last50 = computeWindow(50);
}

// --- V2: Streak Tracking ---

function updateStreaks(mem: PredictionMemory, correct: boolean): void {
  const s = mem.streaks!;
  if (correct) {
    s.current = s.current >= 0 ? s.current + 1 : 1;
    if (s.current > s.longestWin) s.longestWin = s.current;
  } else {
    s.current = s.current <= 0 ? s.current - 1 : -1;
    if (Math.abs(s.current) > s.longestLoss)
      s.longestLoss = Math.abs(s.current);
  }
}

// --- V2: Confidence Calibration ---

function updateCalibration(mem: PredictionMemory): void {
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  if (resolved.length < MIN_PREDICTIONS_FOR_CALIBRATION) return;

  const buckets: Record<string, { sum: number; wins: number; count: number }> =
    {};
  for (const p of resolved) {
    const conf = Math.min(Math.max(p.confidence, 50), 95);
    const bucketKey = `${Math.floor(conf / 5) * 5}-${Math.floor(conf / 5) * 5 + 5}`;
    if (!buckets[bucketKey]) buckets[bucketKey] = { sum: 0, wins: 0, count: 0 };
    buckets[bucketKey].sum += conf;
    buckets[bucketKey].wins += p.correct ? 1 : 0;
    buckets[bucketKey].count += 1;
  }

  const calibrated: Record<string, CalibrationBucket> = {};
  for (const [key, b] of Object.entries(buckets)) {
    calibrated[key] = {
      predictedAvg: Math.round((b.sum / b.count) * 10) / 10,
      actualWinRate: Math.round((b.wins / b.count) * 1000) / 10,
      count: b.count,
    };
  }

  mem.calibration = {
    buckets: calibrated,
    lastCalibrated: new Date().toISOString(),
  };
}

export function applyCalibration(
  rawConfidence: number,
  mem: PredictionMemory,
): number {
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  if (resolved.length < MIN_PREDICTIONS_FOR_CALIBRATION || !mem.calibration) {
    return rawConfidence;
  }

  const conf = Math.min(Math.max(rawConfidence, 50), 95);
  const bucketKey = `${Math.floor(conf / 5) * 5}-${Math.floor(conf / 5) * 5 + 5}`;
  const bucket = mem.calibration.buckets[bucketKey];
  if (!bucket || bucket.count < 3) return rawConfidence;

  const blended = bucket.actualWinRate * 0.7 + rawConfidence * 0.3;
  return Math.round(blended * 10) / 10;
}

function computeCalibrationDrift(mem: PredictionMemory): number {
  if (!mem.calibration || Object.keys(mem.calibration.buckets).length === 0)
    return 0;
  let totalDrift = 0;
  let totalCount = 0;
  for (const b of Object.values(mem.calibration.buckets)) {
    totalDrift += (b.predictedAvg - b.actualWinRate) * b.count;
    totalCount += b.count;
  }
  return totalCount > 0 ? Math.round((totalDrift / totalCount) * 10) / 10 : 0;
}

// --- V2: Upset Tracking ---

function updateUpsetLog(mem: PredictionMemory, pred: PredictionEntry): void {
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  if (resolved.length < MIN_PREDICTIONS_FOR_UPSETS) return;

  const tags: string[] = [];

  // Ranking upset: lower-ranked player won
  if (
    pred.factors.ranking?.favored &&
    pred.actualWinner !== pred.factors.ranking.favored
  ) {
    tags.push("ranking_upset");
  }

  // High confidence miss
  if (!pred.correct && pred.confidence > 70) {
    tags.push("high_confidence_miss");
  }

  // Surface context upset: surface factor was wrong
  const surfaceFactor = pred.factors.surface_context ?? pred.factors.surface;
  if (surfaceFactor?.favored && pred.actualWinner !== surfaceFactor.favored) {
    tags.push("surface_upset");
  }

  if (tags.length === 0) return;

  const log = mem.upsetLog!;
  for (const tag of tags) {
    let entry = log.find((e) => e.tag === tag);
    if (!entry) {
      entry = { tag, upsets: 0, total: 0, rate: 0 };
      log.push(entry);
    }
    entry.total += 1;
    if (!pred.correct) entry.upsets += 1;
    entry.rate = Math.round((entry.upsets / entry.total) * 1000) / 10;
  }
}

// --- V2: Dynamic H2H ---

function makeH2HKey(p1: string, p2: string): string {
  return [p1, p2].sort().join("_vs_");
}

function updateH2HResults(mem: PredictionMemory, pred: PredictionEntry): void {
  if (!pred.actualWinner) return;
  const key = makeH2HKey(pred.player1, pred.player2);
  const h2h = mem.h2hResults!;

  if (!h2h[key]) {
    h2h[key] = {
      player1: [pred.player1, pred.player2].sort()[0],
      player2: [pred.player1, pred.player2].sort()[1],
      p1Wins: 0,
      p2Wins: 0,
      lastMatch: pred.date,
    };
  }

  const record = h2h[key];
  if (pred.actualWinner === record.player1) {
    record.p1Wins += 1;
  } else {
    record.p2Wins += 1;
  }
  record.lastMatch = pred.date;
}

export function getDynamicH2H(
  player1: string,
  player2: string,
  mem: PredictionMemory,
): H2HRecord | null {
  if (!mem.h2hResults) return null;
  const key = makeH2HKey(player1, player2);
  return mem.h2hResults[key] ?? null;
}

// --- Core Resolution ---

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

  const resolved = mem.predictions.filter((p) => p.correct !== null);
  mem.totalCorrect = resolved.filter((p) => p.correct).length;
  mem.accuracy =
    resolved.length > 0
      ? Math.round((mem.totalCorrect / resolved.length) * 1000) / 10
      : 0;

  // V2 updates
  updateRollingWindows(mem, pred.correct);
  updateStreaks(mem, pred.correct);
  updateCalibration(mem);
  updateUpsetLog(mem, pred);
  updateH2HResults(mem, pred);

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

export function getTennisSeasonState(): "active" | "offseason" | "preseason" {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 1 && day < 8) return "preseason";
  if (month === 12 || (month === 11 && day > 24)) return "offseason";
  return "active";
}

const FACTOR_LABELS: Record<string, string> = {
  ranking: "Ranking",
  surface_context: "Surface",
  round_depth: "Round Depth",
  tour_dynamics: "Tour Type",
};

export interface LearningStats {
  totalPredictions: number;
  totalResolved: number;
  totalCorrect: number;
  accuracy: number;
  patterns: string[];
  patternCount: number;
  weights: { name: string; pct: number }[];
  lastUpdate: string | null;
  // V2 stats
  rolling10?: number;
  rolling20?: number;
  rolling50?: number;
  streak?: number;
  calibrationDrift?: number;
  upsetRate?: number;
  h2hTracked?: number;
  version?: number;
}

function buildLearningStats(mem: PredictionMemory): LearningStats {
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  const weights = mem.learnedWeights ?? { ...DEFAULT_WEIGHTS };

  const sortedWeights = Object.entries(weights)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => ({
      name: FACTOR_LABELS[k] ?? k,
      pct: Math.round(v * 1000) / 10,
    }));

  const rw = mem.rollingWindows;
  const wrongCount = resolved.filter((p) => !p.correct).length;

  return {
    totalPredictions: mem.totalPredictions ?? 0,
    totalResolved: resolved.length,
    totalCorrect: mem.totalCorrect ?? 0,
    accuracy: mem.accuracy ?? 0,
    patterns: mem.patterns ?? [],
    patternCount: (mem.patterns ?? []).length,
    weights: sortedWeights,
    lastUpdate: mem.lastWeightUpdate ?? null,
    rolling10: rw?.last10.accuracy ?? 0,
    rolling20: rw?.last20.accuracy ?? 0,
    rolling50: rw?.last50.accuracy ?? 0,
    streak: mem.streaks?.current ?? 0,
    calibrationDrift: computeCalibrationDrift(mem),
    upsetRate:
      resolved.length > 0
        ? Math.round((wrongCount / resolved.length) * 1000) / 10
        : 0,
    h2hTracked: mem.h2hResults ? Object.keys(mem.h2hResults).length : 0,
    version: 2,
  };
}

export function getLearningStats(): LearningStats {
  const mem = loadPredictionMemory();
  return buildLearningStats(mem);
}

export async function getLearningStatsAsync(): Promise<LearningStats> {
  const mem = await loadMemory();
  return buildLearningStats(mem);
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

  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  if (total > 0) {
    for (const k of Object.keys(weights)) {
      weights[k] = Math.round((weights[k] / total) * 10000) / 10000;
    }
  }

  mem.learnedWeights = weights;
  mem.lastWeightUpdate = new Date().toISOString();
}

// --- V2: Enhanced Pattern Detection (10 patterns) ---

function detectPatterns(mem: PredictionMemory): void {
  const resolved = mem.predictions.filter((p) => p.correct !== null);
  if (resolved.length < MIN_PREDICTIONS_FOR_PATTERNS) return;

  const patterns: string[] = [];

  // 1. Higher-ranked player win rate
  const rankFavWins = resolved.filter(
    (p) => p.factors.ranking?.favored === p.actualWinner,
  ).length;
  const rankPct = Math.round((rankFavWins / resolved.length) * 1000) / 10;
  patterns.push(
    `Higher-ranked player wins ${rankPct}% of the time (${rankFavWins}/${resolved.length})`,
  );

  // 2. High confidence accuracy
  const highConf = resolved.filter((p) => p.confidence > 70);
  if (highConf.length > 0) {
    const highCorrect = highConf.filter((p) => p.correct).length;
    const highPct = Math.round((highCorrect / highConf.length) * 1000) / 10;
    patterns.push(
      `High-confidence picks (>70%) hit ${highPct}% (${highCorrect}/${highConf.length})`,
    );
  }

  // 3. Most reliable factor
  const sorted = Object.entries(mem.factorAccuracy)
    .filter(([, v]) => v.total > 0)
    .sort((a, b) => b[1].accuracy - a[1].accuracy);
  if (sorted.length > 0) {
    const [name, data] = sorted[0];
    const label = FACTOR_LABELS[name] ?? name;
    patterns.push(
      `Most reliable factor: ${label} (${data.accuracy}% accurate)`,
    );
  }

  // 4. Calibration drift
  const drift = computeCalibrationDrift(mem);
  if (drift !== 0 && resolved.length >= MIN_PREDICTIONS_FOR_CALIBRATION) {
    const direction = drift > 0 ? "overconfident" : "underconfident";
    patterns.push(`Calibration: model is ${direction} by ${Math.abs(drift)}%`);
  }

  // 5. Rolling trend
  const rw = mem.rollingWindows;
  if (rw && rw.last10.total >= 10 && rw.last20.total >= 20) {
    const trend =
      rw.last10.accuracy > rw.last20.accuracy
        ? "improving"
        : rw.last10.accuracy < rw.last20.accuracy
          ? "declining"
          : "stable";
    patterns.push(
      `Trend: Last 10: ${rw.last10.accuracy}%, Last 20: ${rw.last20.accuracy}% — ${trend}`,
    );
  }

  // 6. Streak info
  const streaks = mem.streaks;
  if (streaks && (streaks.longestWin >= 3 || streaks.longestLoss >= 3)) {
    const currentStr =
      streaks.current > 0
        ? `${streaks.current}W streak`
        : streaks.current < 0
          ? `${Math.abs(streaks.current)}L streak`
          : "no streak";
    patterns.push(
      `Streaks: ${currentStr} (best: ${streaks.longestWin}W, worst: ${streaks.longestLoss}L)`,
    );
  }

  // 7. Upset conditions
  if (
    mem.upsetLog &&
    mem.upsetLog.length > 0 &&
    resolved.length >= MIN_PREDICTIONS_FOR_UPSETS
  ) {
    const highRate = mem.upsetLog
      .filter((e) => e.total >= 3)
      .sort((a, b) => b.rate - a.rate);
    if (highRate.length > 0) {
      const top = highRate[0];
      const tagLabel = top.tag.replace(/_/g, " ");
      patterns.push(
        `Upset alert: ${tagLabel} games miss ${top.rate}% of the time (${top.upsets}/${top.total})`,
      );
    }
  }

  // 8. Best factor per situation (favorites vs underdogs)
  if (resolved.length >= 20) {
    const favorites = resolved.filter((p) => p.confidence >= 65);
    const underdogs = resolved.filter((p) => p.confidence < 65);

    if (favorites.length >= 5 && underdogs.length >= 5) {
      const bestForFavorites = findBestFactor(favorites);
      const bestForUnderdogs = findBestFactor(underdogs);
      if (
        bestForFavorites &&
        bestForUnderdogs &&
        bestForFavorites !== bestForUnderdogs
      ) {
        patterns.push(
          `${FACTOR_LABELS[bestForFavorites] ?? bestForFavorites} best for favorites; ${FACTOR_LABELS[bestForUnderdogs] ?? bestForUnderdogs} best for underdogs`,
        );
      }
    }
  }

  // 9. Dynamic H2H stats
  if (mem.h2hResults) {
    const h2hCount = Object.keys(mem.h2hResults).length;
    if (h2hCount > 0) {
      const rematches = Object.values(mem.h2hResults).filter(
        (r) => r.p1Wins + r.p2Wins >= 2,
      );
      patterns.push(
        `Dynamic H2H: tracking ${h2hCount} matchups (${rematches.length} with 2+ meetings)`,
      );
    }
  }

  // 10. Least reliable factor
  if (sorted.length >= 2) {
    const [worstName, worstData] = sorted[sorted.length - 1];
    const worstLabel = FACTOR_LABELS[worstName] ?? worstName;
    patterns.push(
      `Least reliable factor: ${worstLabel} (${worstData.accuracy}% accurate)`,
    );
  }

  mem.patterns = patterns;
}

function findBestFactor(preds: PredictionEntry[]): string | null {
  const factorHits: Record<string, { correct: number; total: number }> = {};
  for (const p of preds) {
    for (const [name, data] of Object.entries(p.factors)) {
      if (!factorHits[name]) factorHits[name] = { correct: 0, total: 0 };
      factorHits[name].total += 1;
      if (data.favored === p.actualWinner) factorHits[name].correct += 1;
    }
  }
  let best: string | null = null;
  let bestRate = -1;
  for (const [name, hits] of Object.entries(factorHits)) {
    if (hits.total < 3) continue;
    const rate = hits.correct / hits.total;
    if (rate > bestRate) {
      bestRate = rate;
      best = name;
    }
  }
  return best;
}
