"use client";

interface LearningEngineProps {
  stats: {
    totalPredictions: number;
    totalResolved: number;
    totalCorrect: number;
    accuracy: number;
    patterns: string[];
    patternCount: number;
    weights: { name: string; pct: number }[];
    lastUpdate: string | null;
  };
}

export default function LearningEngine({ stats }: LearningEngineProps) {
  const hasResolved = stats.totalResolved > 0;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.03), rgba(34,197,94,0.015))",
        border: "1px solid rgba(34,197,94,0.08)",
        borderRadius: "12px",
        padding: "14px 18px",
        margin: "0 0 20px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: ".6rem",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase" as const,
          color: "#166534",
          marginBottom: "8px",
        }}
      >
        🧠 AI Learning Engine
        {!hasResolved && " — Training on historical data | Ready for Indian Wells"}
      </div>

      {hasResolved ? (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: ".72rem",
            color: "#a3a3a3",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "#22c55e", fontWeight: 700 }}>
            {stats.totalPredictions}
          </span>{" "}
          predictions tracked &middot;{" "}
          <span
            style={{
              color:
                stats.accuracy >= 60
                  ? "#22c55e"
                  : stats.accuracy >= 50
                    ? "#22c55e"
                    : "#ef4444",
              fontWeight: 700,
            }}
          >
            {stats.accuracy}%
          </span>{" "}
          accuracy &middot;{" "}
          <span style={{ color: "#22c55e", fontWeight: 700 }}>
            {stats.patternCount}
          </span>{" "}
          patterns found
        </div>
      ) : (
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: ".72rem",
            color: "#a3a3a3",
            marginBottom: "6px",
          }}
        >
          <span style={{ color: "#22c55e", fontWeight: 700 }}>
            {stats.totalPredictions}
          </span>{" "}
          predictions queued &middot; Awaiting match results to begin learning
        </div>
      )}

      <div style={{ fontSize: ".62rem", color: "#525252", lineHeight: 1.6 }}>
        Currently weighting:{" "}
        {stats.weights.map((w, i) => (
          <span key={w.name}>
            {w.name} ({w.pct}%){i < stats.weights.length - 1 ? " › " : ""}
          </span>
        ))}
      </div>

      {stats.patterns.length > 0 && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "8px",
            borderTop: "1px solid rgba(34,197,94,0.06)",
            textAlign: "left" as const,
          }}
        >
          {stats.patterns.slice(0, 3).map((p, i) => (
            <div
              key={i}
              style={{
                fontSize: ".6rem",
                color: "#3a7a4e",
                padding: "2px 0 2px 12px",
                position: "relative" as const,
              }}
            >
              <span
                style={{
                  position: "absolute" as const,
                  left: 0,
                  top: "7px",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "rgba(34,197,94,0.4)",
                }}
              />
              {p}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
