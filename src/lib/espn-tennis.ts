// ESPN Tennis Live Data Fetcher
// Fetches real-time ATP + WTA scoreboard and rankings data

const ESPN_ATP_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/scoreboard";
const ESPN_WTA_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/tennis/wta/scoreboard";
const ESPN_ATP_RANKINGS =
  "https://site.api.espn.com/apis/site/v2/sports/tennis/atp/rankings";
const ESPN_WTA_RANKINGS =
  "https://site.api.espn.com/apis/site/v2/sports/tennis/wta/rankings";

// ─── Types ───

export interface TennisMatch {
  id: string;
  tournament: string;
  tournamentLocation: string;
  round: string;
  surface: string;
  tour: "ATP" | "WTA";
  startTime: string;
  state: "pre" | "in" | "post";
  statusDetail: string;
  player1: {
    name: string;
    country: string;
    countryFlag: string;
    ranking: number;
  };
  player2: {
    name: string;
    country: string;
    countryFlag: string;
    ranking: number;
  };
  sets: {
    p1: number;
    p2: number;
    p1Tiebreak?: number;
    p2Tiebreak?: number;
  }[];
  winner?: string;
}

export interface TournamentGroup {
  name: string;
  location: string;
  tour: "ATP" | "WTA";
  surface: string;
  matches: TennisMatch[];
}

export interface ESPNMatchWithPrediction extends TennisMatch {
  p1WinPct: number;
  p2WinPct: number;
  confidence: number;
  favoriteName: string;
}

// ─── Surface Mapping ───

const SURFACE_MAP: Record<string, string> = {
  // Hard court tournaments
  dubai: "Hard",
  doha: "Hard",
  qatar: "Hard",
  "delray beach": "Hard",
  "indian wells": "Hard",
  miami: "Hard",
  "us open": "Hard",
  "australian open": "Hard",
  brisbane: "Hard",
  adelaide: "Hard",
  auckland: "Hard",
  "abu dhabi": "Hard",
  beijing: "Hard",
  shanghai: "Hard",
  tokyo: "Hard",
  seoul: "Hard",
  "hong kong": "Hard",
  montreal: "Hard",
  toronto: "Hard",
  cincinnati: "Hard",
  "winston-salem": "Hard",
  washington: "Hard",
  atlanta: "Hard",
  "los cabos": "Hard",
  acapulco: "Hard",
  rotterdam: "Hard",
  marseille: "Hard",
  dallas: "Hard",
  montpellier: "Hard",
  "st. petersburg": "Hard",
  vienna: "Hard",
  basel: "Hard",
  paris: "Hard",
  turin: "Hard",
  atp: "Hard",
  "san diego": "Hard",
  metz: "Hard",
  astana: "Hard",
  antwerp: "Hard",
  sofia: "Hard",
  stockholm: "Hard",
  // Clay court tournaments
  "roland garros": "Clay",
  "french open": "Clay",
  rome: "Clay",
  madrid: "Clay",
  "monte carlo": "Clay",
  "monte-carlo": "Clay",
  barcelona: "Clay",
  rio: "Clay",
  "buenos aires": "Clay",
  "sao paulo": "Clay",
  santiago: "Clay",
  houston: "Clay",
  marrakech: "Clay",
  bucharest: "Clay",
  munich: "Clay",
  lyon: "Clay",
  geneva: "Clay",
  hamburg: "Clay",
  gstaad: "Clay",
  kitzbuhel: "Clay",
  umag: "Clay",
  bastad: "Clay",
  // Grass court tournaments
  wimbledon: "Grass",
  halle: "Grass",
  "queen's": "Grass",
  queens: "Grass",
  eastbourne: "Grass",
  "s-hertogenbosch": "Grass",
  stuttgart: "Grass",
  mallorca: "Grass",
  nottingham: "Grass",
  birmingham: "Grass",
  berlin: "Grass",
};

function detectSurface(tournamentName: string, location: string): string {
  const searchStr = `${tournamentName} ${location}`.toLowerCase();
  for (const [key, surface] of Object.entries(SURFACE_MAP)) {
    if (searchStr.includes(key)) {
      return surface;
    }
  }
  return "Hard";
}

// ─── ESPN API Response Types (partial) ───

interface ESPNAthlete {
  displayName?: string;
  flag?: {
    alt?: string;
    href?: string;
  };
  headshot?: {
    href?: string;
  };
}

interface ESPNCompetitor {
  athlete?: ESPNAthlete;
  winner?: boolean;
  linescores?: { value?: number; tiebreak?: number }[];
}

interface ESPNStatus {
  type?: {
    state?: string;
    detail?: string;
  };
}

interface ESPNRound {
  displayName?: string;
}

interface ESPNCompetition {
  id?: string;
  date?: string;
  competitors?: ESPNCompetitor[];
  status?: ESPNStatus;
  round?: ESPNRound;
}

interface ESPNGrouping {
  competitions?: ESPNCompetition[];
}

interface ESPNVenue {
  displayName?: string;
  address?: {
    city?: string;
    country?: string;
  };
}

interface ESPNEvent {
  id?: string;
  name?: string;
  venue?: ESPNVenue;
  groupings?: ESPNGrouping[];
  competitions?: ESPNCompetition[];
}

interface ESPNScoreboardResponse {
  events?: ESPNEvent[];
}

interface ESPNRankEntry {
  current?: number;
  athlete?: {
    displayName?: string;
    id?: string;
    flag?: { alt?: string; href?: string };
    headshot?: { href?: string };
  };
  points?: number;
}

interface ESPNRanking {
  ranks?: ESPNRankEntry[];
}

interface ESPNRankingsResponse {
  rankings?: ESPNRanking[];
}

// ─── Fetch Helpers ───

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 120 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function buildRankingsMap(
  data: ESPNRankingsResponse | null,
): Map<string, number> {
  const map = new Map<string, number>();
  if (!data?.rankings) return map;
  for (const ranking of data.rankings) {
    if (!ranking.ranks) continue;
    for (const entry of ranking.ranks) {
      if (entry.athlete?.displayName && entry.current) {
        map.set(entry.athlete.displayName.toLowerCase(), entry.current);
      }
    }
  }
  return map;
}

function extractCountryCode(flagAlt?: string): string {
  if (!flagAlt) return "";
  return flagAlt.trim();
}

// ─── Main Fetcher ───

export async function fetchAllTennisMatches(): Promise<TournamentGroup[]> {
  // Fetch all four endpoints in parallel
  const [atpScoreboard, wtaScoreboard, atpRankings, wtaRankings] =
    await Promise.all([
      fetchJSON<ESPNScoreboardResponse>(ESPN_ATP_SCOREBOARD),
      fetchJSON<ESPNScoreboardResponse>(ESPN_WTA_SCOREBOARD),
      fetchJSON<ESPNRankingsResponse>(ESPN_ATP_RANKINGS),
      fetchJSON<ESPNRankingsResponse>(ESPN_WTA_RANKINGS),
    ]);

  // Build rankings lookup
  const atpRanksMap = buildRankingsMap(atpRankings);
  const wtaRanksMap = buildRankingsMap(wtaRankings);

  const tournamentMap = new Map<string, TournamentGroup>();

  function processEvents(
    events: ESPNEvent[] | undefined,
    tour: "ATP" | "WTA",
    ranksMap: Map<string, number>,
  ): void {
    if (!events) return;

    for (const event of events) {
      const tournamentName = event.name ?? "Unknown Tournament";
      const location = buildLocationString(event.venue);
      const surface = detectSurface(tournamentName, location);

      // ESPN sometimes uses groupings, sometimes direct competitions
      const allCompetitions: ESPNCompetition[] = [];

      if (event.groupings) {
        for (const grouping of event.groupings) {
          if (grouping.competitions) {
            allCompetitions.push(...grouping.competitions);
          }
        }
      }
      if (event.competitions) {
        allCompetitions.push(...event.competitions);
      }

      for (const comp of allCompetitions) {
        const match = parseCompetition(
          comp,
          tournamentName,
          location,
          surface,
          tour,
          ranksMap,
        );
        if (!match) continue;

        const groupKey = `${tournamentName}-${tour}`;
        if (!tournamentMap.has(groupKey)) {
          tournamentMap.set(groupKey, {
            name: tournamentName,
            location,
            tour,
            surface,
            matches: [],
          });
        }
        tournamentMap.get(groupKey)!.matches.push(match);
      }
    }
  }

  processEvents(atpScoreboard?.events, "ATP", atpRanksMap);
  processEvents(wtaScoreboard?.events, "WTA", wtaRanksMap);

  // Sort matches within each tournament: live first, then pre, then post
  const stateOrder: Record<string, number> = { in: 0, pre: 1, post: 2 };
  const allGroups = Array.from(tournamentMap.values());
  for (const group of allGroups) {
    group.matches.sort((a, b) => {
      const orderA = stateOrder[a.state] ?? 1;
      const orderB = stateOrder[b.state] ?? 1;
      if (orderA !== orderB) return orderA - orderB;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });
  }

  return allGroups;
}

function buildLocationString(venue?: ESPNVenue): string {
  if (!venue) return "";
  const parts: string[] = [];
  if (venue.address?.city) parts.push(venue.address.city);
  if (venue.address?.country) parts.push(venue.address.country);
  if (parts.length === 0 && venue.displayName) return venue.displayName;
  return parts.join(", ");
}

function parseCompetition(
  comp: ESPNCompetition,
  tournament: string,
  location: string,
  surface: string,
  tour: "ATP" | "WTA",
  ranksMap: Map<string, number>,
): TennisMatch | null {
  if (!comp.competitors || comp.competitors.length < 2) return null;

  const c1 = comp.competitors[0];
  const c2 = comp.competitors[1];

  const p1Name = c1.athlete?.displayName ?? "";
  const p2Name = c2.athlete?.displayName ?? "";

  // Skip TBD/unknown players
  if (
    !p1Name ||
    !p2Name ||
    p1Name === "TBD" ||
    p2Name === "TBD" ||
    p1Name === "?" ||
    p2Name === "?"
  ) {
    return null;
  }

  const p1Rank = ranksMap.get(p1Name.toLowerCase()) ?? 999;
  const p2Rank = ranksMap.get(p2Name.toLowerCase()) ?? 999;

  const p1Country = extractCountryCode(c1.athlete?.flag?.alt);
  const p2Country = extractCountryCode(c2.athlete?.flag?.alt);

  const p1Flag = c1.athlete?.flag?.href ?? "";
  const p2Flag = c2.athlete?.flag?.href ?? "";

  // Parse set scores
  const sets: TennisMatch["sets"] = [];
  const p1Lines = c1.linescores ?? [];
  const p2Lines = c2.linescores ?? [];
  const setCount = Math.max(p1Lines.length, p2Lines.length);
  for (let i = 0; i < setCount; i++) {
    const setData: TennisMatch["sets"][number] = {
      p1: p1Lines[i]?.value ?? 0,
      p2: p2Lines[i]?.value ?? 0,
    };
    if (p1Lines[i]?.tiebreak !== undefined) {
      setData.p1Tiebreak = p1Lines[i].tiebreak;
    }
    if (p2Lines[i]?.tiebreak !== undefined) {
      setData.p2Tiebreak = p2Lines[i].tiebreak;
    }
    sets.push(setData);
  }

  const state = (comp.status?.type?.state ?? "pre") as "pre" | "in" | "post";
  const statusDetail = comp.status?.type?.detail ?? "";

  let winner: string | undefined;
  if (state === "post") {
    if (c1.winner) winner = p1Name;
    else if (c2.winner) winner = p2Name;
  }

  return {
    id: comp.id ?? `${tour}-${p1Name}-${p2Name}-${comp.date ?? ""}`,
    tournament,
    tournamentLocation: location,
    round: comp.round?.displayName ?? "",
    surface,
    tour,
    startTime: comp.date ?? new Date().toISOString(),
    state,
    statusDetail,
    player1: {
      name: p1Name,
      country: p1Country,
      countryFlag: p1Flag,
      ranking: p1Rank,
    },
    player2: {
      name: p2Name,
      country: p2Country,
      countryFlag: p2Flag,
      ranking: p2Rank,
    },
    sets,
    winner,
  };
}

// ─── Quick Prediction ───

export function quickPrediction(
  p1Rank: number,
  p2Rank: number,
): { p1WinPct: number; p2WinPct: number; confidence: number } {
  const rankDiff = p2Rank - p1Rank;
  const rankProb = 1 / (1 + Math.pow(10, -rankDiff / 100));
  const amplified = 0.5 + (rankProb - 0.5) * 1.4;
  const p1Final = Math.min(0.85, Math.max(0.15, amplified));
  const p1WinPct = Math.round(p1Final * 100);
  return {
    p1WinPct,
    p2WinPct: 100 - p1WinPct,
    confidence: Math.abs(p1WinPct - 50) + 50,
  };
}

// ─── Add predictions to matches ───

export function addPredictions(groups: TournamentGroup[]): {
  groups: (TournamentGroup & { matches: ESPNMatchWithPrediction[] })[];
  lockOfDay: ESPNMatchWithPrediction | null;
} {
  let lockOfDay: ESPNMatchWithPrediction | null = null;

  const enrichedGroups = groups.map((group) => {
    const enrichedMatches: ESPNMatchWithPrediction[] = group.matches.map(
      (match) => {
        const pred = quickPrediction(
          match.player1.ranking,
          match.player2.ranking,
        );
        const favoriteName =
          pred.p1WinPct >= pred.p2WinPct
            ? match.player1.name
            : match.player2.name;

        const enriched: ESPNMatchWithPrediction = {
          ...match,
          p1WinPct: pred.p1WinPct,
          p2WinPct: pred.p2WinPct,
          confidence: pred.confidence,
          favoriteName,
        };

        // Track Lock of the Day: highest confidence upcoming match
        if (
          match.state === "pre" &&
          (!lockOfDay || pred.confidence > lockOfDay.confidence)
        ) {
          lockOfDay = enriched;
        }

        return enriched;
      },
    );

    return { ...group, matches: enrichedMatches };
  });

  return { groups: enrichedGroups, lockOfDay };
}
