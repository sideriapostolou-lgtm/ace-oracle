import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getCountryFlag(countryCode: string): string {
  const flags: Record<string, string> = {
    SRB: "🇷🇸",
    ESP: "🇪🇸",
    ITA: "🇮🇹",
    GER: "🇩🇪",
    RUS: "🇷🇺",
    USA: "🇺🇸",
    GBR: "🇬🇧",
    FRA: "🇫🇷",
    AUS: "🇦🇺",
    GRE: "🇬🇷",
    CAN: "🇨🇦",
    NOR: "🇳🇴",
    POL: "🇵🇱",
    DEN: "🇩🇰",
    CHN: "🇨🇳",
    JPN: "🇯🇵",
    ARG: "🇦🇷",
    BRA: "🇧🇷",
    CHI: "🇨🇱",
    CRO: "🇭🇷",
    SUI: "🇨🇭",
    BEL: "🇧🇪",
    AUT: "🇦🇹",
    NED: "🇳🇱",
    CZE: "🇨🇿",
    KAZ: "🇰🇿",
    BUL: "🇧🇬",
    TUN: "🇹🇳",
    HUN: "🇭🇺",
    ROU: "🇷🇴",
    BLR: "🇧🇾",
    COL: "🇨🇴",
    POR: "🇵🇹",
    RSA: "🇿🇦",
    TPE: "🇹🇼",
  };
  return flags[countryCode] || "🏳️";
}

export function getSurfaceColor(surface: string): string {
  const colors: Record<string, string> = {
    Hard: "bg-blue-500/20 text-blue-400",
    Clay: "bg-orange-500/20 text-orange-400",
    Grass: "bg-green-500/20 text-green-400",
    Carpet: "bg-purple-500/20 text-purple-400",
  };
  return colors[surface] || "bg-gray-500/20 text-gray-400";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    upcoming: "bg-yellow-500/20 text-yellow-400",
    live: "bg-red-500/20 text-red-400",
    completed: "bg-green-500/20 text-green-400",
  };
  return colors[status] || "bg-gray-500/20 text-gray-400";
}

export function calculateWinProbability(
  p1Ranking: number,
  p2Ranking: number,
  p1SurfaceWin?: string,
  p2SurfaceWin?: string,
  surface?: string,
  h2hP1Wins?: number,
  h2hP2Wins?: number,
): { p1: number; p2: number } {
  // Elo-inspired ranking factor
  const rankDiff = p2Ranking - p1Ranking;
  const rankProb = 1 / (1 + Math.pow(10, -rankDiff / 250));

  // Surface factor
  let surfaceProb = 0.5;
  if (p1SurfaceWin && p2SurfaceWin && surface) {
    try {
      const p1S = JSON.parse(p1SurfaceWin);
      const p2S = JSON.parse(p2SurfaceWin);
      const key = surface.toLowerCase();
      if (p1S[key] && p2S[key]) {
        surfaceProb = p1S[key] / (p1S[key] + p2S[key]);
      }
    } catch {
      surfaceProb = 0.5;
    }
  }

  // H2H factor
  let h2hProb = 0.5;
  if (h2hP1Wins !== undefined && h2hP2Wins !== undefined) {
    const total = h2hP1Wins + h2hP2Wins;
    if (total > 0) {
      h2hProb = h2hP1Wins / total;
    }
  }

  // Weighted combination
  const p1Prob = rankProb * 0.5 + surfaceProb * 0.3 + h2hProb * 0.2;
  const p1Final = Math.min(0.95, Math.max(0.05, p1Prob));

  return {
    p1: Math.round(p1Final * 100),
    p2: Math.round((1 - p1Final) * 100),
  };
}
