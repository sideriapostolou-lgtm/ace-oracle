"use client";

import type { ESPNMatchWithPrediction } from "@/lib/espn-tennis";
import type { SerializedTournamentGroup } from "@/app/page";

interface DashboardClientProps {
  tournamentGroups: SerializedTournamentGroup[];
  lockOfDay: ESPNMatchWithPrediction | null;
  fetchError: boolean;
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

function getSurfaceClass(surface: string): string {
  if (surface === "Hard") return "surface-hard";
  if (surface === "Clay") return "surface-clay";
  return "surface-grass";
}

function formatMatchTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatSetScore(match: ESPNMatchWithPrediction): string {
  if (match.sets.length === 0) return "";
  return match.sets
    .map((s) => {
      let score = `${s.p1}-${s.p2}`;
      if (s.p1Tiebreak !== undefined || s.p2Tiebreak !== undefined) {
        const tb = Math.min(s.p1Tiebreak ?? 99, s.p2Tiebreak ?? 99);
        score += `(${tb})`;
      }
      return score;
    })
    .join("  ");
}

function getCountryDisplay(country: string): string {
  // ESPN gives full country names, map common ones to flag emoji
  const flagMap: Record<string, string> = {
    Italy: "\u{1F1EE}\u{1F1F9}",
    Spain: "\u{1F1EA}\u{1F1F8}",
    Germany: "\u{1F1E9}\u{1F1EA}",
    France: "\u{1F1EB}\u{1F1F7}",
    "United States": "\u{1F1FA}\u{1F1F8}",
    USA: "\u{1F1FA}\u{1F1F8}",
    "United Kingdom": "\u{1F1EC}\u{1F1E7}",
    "Great Britain": "\u{1F1EC}\u{1F1E7}",
    Russia: "\u{1F1F7}\u{1F1FA}",
    Serbia: "\u{1F1F7}\u{1F1F8}",
    Australia: "\u{1F1E6}\u{1F1FA}",
    Canada: "\u{1F1E8}\u{1F1E6}",
    Greece: "\u{1F1EC}\u{1F1F7}",
    Norway: "\u{1F1F3}\u{1F1F4}",
    Poland: "\u{1F1F5}\u{1F1F1}",
    Denmark: "\u{1F1E9}\u{1F1F0}",
    China: "\u{1F1E8}\u{1F1F3}",
    Japan: "\u{1F1EF}\u{1F1F5}",
    Argentina: "\u{1F1E6}\u{1F1F7}",
    Brazil: "\u{1F1E7}\u{1F1F7}",
    Switzerland: "\u{1F1E8}\u{1F1ED}",
    Belgium: "\u{1F1E7}\u{1F1EA}",
    Austria: "\u{1F1E6}\u{1F1F9}",
    Netherlands: "\u{1F1F3}\u{1F1F1}",
    "Czech Republic": "\u{1F1E8}\u{1F1FF}",
    Czechia: "\u{1F1E8}\u{1F1FF}",
    Kazakhstan: "\u{1F1F0}\u{1F1FF}",
    Bulgaria: "\u{1F1E7}\u{1F1EC}",
    Tunisia: "\u{1F1F9}\u{1F1F3}",
    Hungary: "\u{1F1ED}\u{1F1FA}",
    Romania: "\u{1F1F7}\u{1F1F4}",
    Belarus: "\u{1F1E7}\u{1F1FE}",
    Colombia: "\u{1F1E8}\u{1F1F4}",
    Portugal: "\u{1F1F5}\u{1F1F9}",
    Croatia: "\u{1F1ED}\u{1F1F7}",
    Chile: "\u{1F1E8}\u{1F1F1}",
    "South Africa": "\u{1F1FF}\u{1F1E6}",
    Taiwan: "\u{1F1F9}\u{1F1FC}",
    "Chinese Taipei": "\u{1F1F9}\u{1F1FC}",
    Ukraine: "\u{1F1FA}\u{1F1E6}",
    Georgia: "\u{1F1EC}\u{1F1EA}",
    Mexico: "\u{1F1F2}\u{1F1FD}",
    India: "\u{1F1EE}\u{1F1F3}",
    "South Korea": "\u{1F1F0}\u{1F1F7}",
    Korea: "\u{1F1F0}\u{1F1F7}",
    Finland: "\u{1F1EB}\u{1F1EE}",
    Sweden: "\u{1F1F8}\u{1F1EA}",
    "Bosnia and Herzegovina": "\u{1F1E7}\u{1F1E6}",
    Slovakia: "\u{1F1F8}\u{1F1F0}",
    Latvia: "\u{1F1F1}\u{1F1FB}",
    Estonia: "\u{1F1EA}\u{1F1EA}",
    Lithuania: "\u{1F1F1}\u{1F1F9}",
    Slovenia: "\u{1F1F8}\u{1F1EE}",
    Moldova: "\u{1F1F2}\u{1F1E9}",
    Montenegro: "\u{1F1F2}\u{1F1EA}",
    "North Macedonia": "\u{1F1F2}\u{1F1F0}",
    Albania: "\u{1F1E6}\u{1F1F1}",
    ITA: "\u{1F1EE}\u{1F1F9}",
    ESP: "\u{1F1EA}\u{1F1F8}",
    GER: "\u{1F1E9}\u{1F1EA}",
    FRA: "\u{1F1EB}\u{1F1F7}",
    GBR: "\u{1F1EC}\u{1F1E7}",
    RUS: "\u{1F1F7}\u{1F1FA}",
    SRB: "\u{1F1F7}\u{1F1F8}",
    AUS: "\u{1F1E6}\u{1F1FA}",
    CAN: "\u{1F1E8}\u{1F1E6}",
    GRE: "\u{1F1EC}\u{1F1F7}",
    NOR: "\u{1F1F3}\u{1F1F4}",
    POL: "\u{1F1F5}\u{1F1F1}",
    DEN: "\u{1F1E9}\u{1F1F0}",
    CHN: "\u{1F1E8}\u{1F1F3}",
    JPN: "\u{1F1EF}\u{1F1F5}",
    ARG: "\u{1F1E6}\u{1F1F7}",
    BRA: "\u{1F1E7}\u{1F1F7}",
    SUI: "\u{1F1E8}\u{1F1ED}",
    BEL: "\u{1F1E7}\u{1F1EA}",
    AUT: "\u{1F1E6}\u{1F1F9}",
    NED: "\u{1F1F3}\u{1F1F1}",
    CZE: "\u{1F1E8}\u{1F1FF}",
    KAZ: "\u{1F1F0}\u{1F1FF}",
    BUL: "\u{1F1E7}\u{1F1EC}",
    TUN: "\u{1F1F9}\u{1F1F3}",
    HUN: "\u{1F1ED}\u{1F1FA}",
    ROU: "\u{1F1F7}\u{1F1F4}",
    BLR: "\u{1F1E7}\u{1F1FE}",
    COL: "\u{1F1E8}\u{1F1F4}",
    POR: "\u{1F1F5}\u{1F1F9}",
    CRO: "\u{1F1ED}\u{1F1F7}",
    CHI: "\u{1F1E8}\u{1F1F1}",
    RSA: "\u{1F1FF}\u{1F1E6}",
    TPE: "\u{1F1F9}\u{1F1FC}",
    UKR: "\u{1F1FA}\u{1F1E6}",
    GEO: "\u{1F1EC}\u{1F1EA}",
    MEX: "\u{1F1F2}\u{1F1FD}",
    IND: "\u{1F1EE}\u{1F1F3}",
    KOR: "\u{1F1F0}\u{1F1F7}",
    FIN: "\u{1F1EB}\u{1F1EE}",
    SWE: "\u{1F1F8}\u{1F1EA}",
    BIH: "\u{1F1E7}\u{1F1E6}",
    SVK: "\u{1F1F8}\u{1F1F0}",
    LAT: "\u{1F1F1}\u{1F1FB}",
    EST: "\u{1F1EA}\u{1F1EA}",
    LTU: "\u{1F1F1}\u{1F1F9}",
    SLO: "\u{1F1F8}\u{1F1EE}",
    MDA: "\u{1F1F2}\u{1F1E9}",
    MNE: "\u{1F1F2}\u{1F1EA}",
    MKD: "\u{1F1F2}\u{1F1F0}",
    ALB: "\u{1F1E6}\u{1F1F1}",
  };
  return flagMap[country] ?? "\u{1F3F3}\u{FE0F}";
}

function getLastName(fullName: string): string {
  const parts = fullName.split(" ");
  return parts[parts.length - 1] ?? fullName;
}

// ─── Match Card for Live, Upcoming, Completed ───

function MatchCard({ match }: { match: ESPNMatchWithPrediction }) {
  const p1Last = getLastName(match.player1.name);
  const p2Last = getLastName(match.player2.name);
  const cardSurfaceClass = `card-${match.surface.toLowerCase()}`;
  const isLive = match.state === "in";
  const isCompleted = match.state === "post";
  const isUpcoming = match.state === "pre";

  return (
    <div
      className={`game-card ${cardSurfaceClass} ${isLive ? "live-card" : ""} ${isCompleted ? "completed-card" : ""}`}
    >
      {/* Meta line */}
      <div className="match-meta">
        <span>{match.round}</span>
        {match.tour && (
          <>
            <span className="dot">&middot;</span>
            <span className="tour-badge">{match.tour}</span>
          </>
        )}
        <span className="dot">&middot;</span>
        <span className={`surface-tag ${getSurfaceClass(match.surface)}`}>
          {match.surface}
        </span>
        {isLive && (
          <>
            <span className="dot">&middot;</span>
            <span className="live-badge">LIVE</span>
          </>
        )}
        {isUpcoming && (
          <>
            <span className="dot">&middot;</span>
            <span>{formatMatchTime(match.startTime)}</span>
          </>
        )}
        {isCompleted && match.statusDetail && (
          <>
            <span className="dot">&middot;</span>
            <span className="completed-tag">Final</span>
          </>
        )}
      </div>

      {/* Matchup */}
      <div className="matchup">
        <div
          className={`player-side ${isCompleted && match.winner === match.player1.name ? "winner-side" : ""}`}
        >
          <div className="player-name">
            {getCountryDisplay(match.player1.country)} {p1Last}
          </div>
          <div className="player-rank">
            #{match.player1.ranking}
            {isCompleted && match.winner === match.player1.name && (
              <span className="winner-check"> \u2713</span>
            )}
          </div>
        </div>
        <div className="vs-divider">vs</div>
        <div
          className={`player-side right ${isCompleted && match.winner === match.player2.name ? "winner-side" : ""}`}
        >
          <div className="player-name">
            {p2Last} {getCountryDisplay(match.player2.country)}
          </div>
          <div className="player-rank">
            #{match.player2.ranking}
            {isCompleted && match.winner === match.player2.name && (
              <span className="winner-check"> \u2713</span>
            )}
          </div>
        </div>
      </div>

      {/* Live / Completed: Show Scores */}
      {(isLive || isCompleted) && match.sets.length > 0 && (
        <div className="score-line">
          <span className="score-text mono">{formatSetScore(match)}</span>
          {isLive && match.statusDetail && (
            <span className="status-detail">{match.statusDetail}</span>
          )}
        </div>
      )}

      {/* Upcoming: Show Prediction */}
      {isUpcoming && (
        <div className="pick-section">
          <div className="pick-winner">
            <span className="pick-arrow">&rarr;</span>
            <span className="pick-name">{getLastName(match.favoriteName)}</span>
          </div>
          <span
            className={`pick-conf ${getConfidenceLevel(match.p1WinPct, match.p2WinPct)}`}
          >
            {Math.max(match.p1WinPct, match.p2WinPct)}%
          </span>
        </div>
      )}

      {/* Upcoming: Edge Bullets */}
      {isUpcoming && (
        <div className="edge-section">
          <div className="edge-label">The Edge</div>
          <ul className="edge-bullets">
            {buildQuickBullets(match).map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function buildQuickBullets(match: ESPNMatchWithPrediction): string[] {
  const bullets: string[] = [];
  const p1 = match.player1;
  const p2 = match.player2;
  const favIsP1 = match.p1WinPct >= match.p2WinPct;
  const fav = favIsP1 ? p1 : p2;
  const opp = favIsP1 ? p2 : p1;
  const favLast = getLastName(fav.name);

  const rankGap = Math.abs(fav.ranking - opp.ranking);
  if (fav.ranking < opp.ranking) {
    if (rankGap > 30) {
      bullets.push(
        `#${fav.ranking} vs #${opp.ranking} \u2014 massive ranking gap`,
      );
    } else if (rankGap > 10) {
      bullets.push(
        `Ranked #${fav.ranking} vs #${opp.ranking} \u2014 clear tier above`,
      );
    } else {
      bullets.push(
        `#${fav.ranking} vs #${opp.ranking} \u2014 slight edge on paper`,
      );
    }
  } else if (fav.ranking > opp.ranking) {
    bullets.push(
      `Ranked #${fav.ranking} vs #${opp.ranking} \u2014 upset watch, but form prevails`,
    );
  } else {
    bullets.push(
      `Both ranked #${fav.ranking} \u2014 comes down to the details`,
    );
  }

  bullets.push(
    `${match.surface} court specialist \u2014 ${favLast} holds the advantage`,
  );

  const winPct = Math.max(match.p1WinPct, match.p2WinPct);
  if (winPct >= 68) {
    bullets.push(`High confidence pick at ${winPct}% win probability`);
  } else if (winPct >= 58) {
    bullets.push(
      `Moderate edge \u2014 ${favLast} favored at ${winPct}% win probability`,
    );
  } else {
    bullets.push(
      `Tight matchup \u2014 rankings give ${favLast} a marginal edge`,
    );
  }

  return bullets.slice(0, 3);
}

// ─── Lock of the Day Component ───

function LockOfDaySection({ match }: { match: ESPNMatchWithPrediction }) {
  const favLast = getLastName(match.favoriteName);
  const favIsP1 = match.p1WinPct >= match.p2WinPct;
  const favorite = favIsP1 ? match.player1 : match.player2;
  const lockWinPct = Math.max(match.p1WinPct, match.p2WinPct);
  const confClass = lockWinPct >= 68 ? "" : lockWinPct >= 58 ? "medium" : "low";
  const surfaceClass = `lock-surface-${match.surface.toLowerCase()}`;
  const surfaceMetaClass = `meta-surface-${match.surface.toLowerCase()}`;

  return (
    <div className={`lock-section animate-in ${surfaceClass}`}>
      <div className="lock-badge">Lock of the Day</div>

      <div className="lock-matchup">
        {match.player1.name} (#{match.player1.ranking}) vs {match.player2.name}{" "}
        (#{match.player2.ranking}) &middot; {match.tournament} &middot;{" "}
        {match.round}
      </div>

      <div className="lock-pick-label">The Pick</div>
      <div className="lock-pick-name">
        {getCountryDisplay(favorite.country)} {favLast}
      </div>

      <div className="confidence-bar">
        <div
          className={`confidence-fill ${confClass}`}
          style={{ width: `${lockWinPct}%` }}
        />
      </div>

      <div className="lock-edge">
        <div className="lock-edge-label">The Edge</div>
        <ul className="lock-edge-list">
          {buildQuickBullets(match).map((bullet, i) => (
            <li key={i}>{bullet}</li>
          ))}
        </ul>
      </div>

      <div className="lock-meta">
        <div className="meta-item">
          <div className="meta-value">{lockWinPct}%</div>
          <div className="meta-label">Win Prob</div>
        </div>
        <div className="meta-item">
          <div className={`meta-value ${surfaceMetaClass}`}>
            {match.surface}
          </div>
          <div className="meta-label">Surface</div>
        </div>
        <div className="meta-item">
          <div className="meta-value">{match.tour}</div>
          <div className="meta-label">Tour</div>
        </div>
      </div>
    </div>
  );
}

// ─── Tournament Section ───

function TournamentSection({ group }: { group: SerializedTournamentGroup }) {
  const liveMatches = group.matches.filter((m) => m.state === "in");
  const upcomingMatches = group.matches.filter((m) => m.state === "pre");
  const completedMatches = group.matches.filter((m) => m.state === "post");

  return (
    <div className="tournament-section">
      {/* Tournament Header */}
      <div className="tournament-header">
        <div className="tournament-name">{group.name}</div>
        <div className="tournament-meta">
          {group.location && (
            <>
              <span>{group.location}</span>
              <span className="dot">&middot;</span>
            </>
          )}
          <span className="tour-badge">{group.tour}</span>
          <span className="dot">&middot;</span>
          <span className={`surface-tag ${getSurfaceClass(group.surface)}`}>
            {group.surface}
          </span>
        </div>
      </div>

      {/* Live Matches */}
      {liveMatches.length > 0 && (
        <>
          <div className="match-state-label live-label">Live Now</div>
          <div className="stagger">
            {liveMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}

      {/* Upcoming Matches */}
      {upcomingMatches.length > 0 && (
        <>
          <div className="match-state-label">Upcoming</div>
          <div className="stagger">
            {upcomingMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}

      {/* Completed Matches */}
      {completedMatches.length > 0 && (
        <>
          <div className="match-state-label completed-label">Completed</div>
          <div className="stagger">
            {completedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Dashboard ───

export default function DashboardClient({
  tournamentGroups,
  lockOfDay,
  fetchError,
}: DashboardClientProps) {
  if (fetchError) {
    return (
      <div className="no-matches">
        <h3>Unable to Load Live Matches</h3>
        <p>
          ESPN data is temporarily unavailable. Please check back in a few
          minutes.
        </p>
      </div>
    );
  }

  const hasMatches = tournamentGroups.some((g) => g.matches.length > 0);

  if (!hasMatches) {
    return (
      <div className="no-matches">
        <h3>No Matches Right Now</h3>
        <p>Check back when tournaments are underway for live predictions.</p>
      </div>
    );
  }

  return (
    <>
      {/* Lock of the Day */}
      {lockOfDay && <LockOfDaySection match={lockOfDay} />}

      {lockOfDay && (
        <div className="net-divider">
          <div className="net-divider-icon" />
        </div>
      )}

      {/* Tournament Groups */}
      {tournamentGroups.map((group) => (
        <TournamentSection key={`${group.name}-${group.tour}`} group={group} />
      ))}
    </>
  );
}
