import { fetchAllTennisMatches, addPredictions } from "@/lib/espn-tennis";
import type {
  TournamentGroup,
  ESPNMatchWithPrediction,
} from "@/lib/espn-tennis";
import { getSeasonRecord } from "@/lib/result-checker";
import { getLearningStats } from "@/lib/learning-engine";
import DashboardClient from "@/components/DashboardClient";
import LearningEngine from "@/components/LearningEngine";

export const revalidate = 120;

export interface SerializedTournamentGroup {
  name: string;
  location: string;
  tour: "ATP" | "WTA";
  surface: string;
  matches: ESPNMatchWithPrediction[];
}

export default async function HomePage() {
  let tournamentGroups: SerializedTournamentGroup[] = [];
  let lockOfDay: ESPNMatchWithPrediction | null = null;
  let fetchError = false;

  try {
    const rawGroups: TournamentGroup[] = await fetchAllTennisMatches();
    const result = addPredictions(rawGroups);
    tournamentGroups = result.groups;
    lockOfDay = result.lockOfDay;
  } catch {
    fetchError = true;
  }

  const totalMatches = tournamentGroups.reduce(
    (sum, g) => sum + g.matches.length,
    0,
  );
  const liveCount = tournamentGroups.reduce(
    (sum, g) => sum + g.matches.filter((m) => m.state === "in").length,
    0,
  );

  const record = await getSeasonRecord();
  const learningStats = getLearningStats();

  return (
    <div className="container">
      {/* Header */}
      <header className="site-header">
        <h1 className="font-heading">ACE ORACLE</h1>
        <p className="tagline">AI Tennis Predictions</p>
      </header>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat">
          <div
            className={`stat-value mono ${record.total > 0 ? (record.accuracy >= 55 ? "good" : record.accuracy < 50 ? "bad" : "") : ""}`}
          >
            {record.wins}-{record.losses}
          </div>
          <div className="stat-label">Record</div>
        </div>
        <div className="stat">
          <div
            className={`stat-value mono ${record.total > 0 ? (record.accuracy >= 55 ? "good" : record.accuracy < 50 ? "bad" : "") : ""}`}
          >
            {record.total > 0 ? `${record.accuracy}%` : "\u2014"}
          </div>
          <div className="stat-label">Accuracy</div>
        </div>
        <div className="stat">
          <div className="stat-value mono">{totalMatches}</div>
          <div className="stat-label">Matches</div>
        </div>
        {liveCount > 0 && (
          <div className="stat">
            <div className="stat-value mono live-pulse">{liveCount}</div>
            <div className="stat-label">Live</div>
          </div>
        )}
      </div>

      {/* AI Learning Engine */}
      <LearningEngine stats={learningStats} />

      {/* Dashboard */}
      <DashboardClient
        tournamentGroups={tournamentGroups}
        lockOfDay={lockOfDay}
        fetchError={fetchError}
      />
    </div>
  );
}
