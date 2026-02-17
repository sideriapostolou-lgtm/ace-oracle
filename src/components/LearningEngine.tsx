"use client";

import { useState, useEffect, useRef } from "react";

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
    rolling10?: number;
    rolling20?: number;
    rolling50?: number;
    streak?: number;
    calibrationDrift?: number;
    upsetRate?: number;
    version?: number;
  };
}

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    if (animated.current || target === 0) {
      setValue(target);
      return;
    }
    animated.current = true;
    const duration = 800;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target * 10) / 10);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target]);

  return (
    <span ref={ref}>
      {value % 1 === 0 ? value : value.toFixed(1)}
      {suffix}
    </span>
  );
}

const DEFAULT_WEIGHTS: Record<string, number> = {
  Rankings: 30,
  Surface: 20,
  "Head-to-Head": 20,
  Form: 20,
  Fatigue: 10,
};

export default function LearningEngine({ stats }: LearningEngineProps) {
  const [expanded, setExpanded] = useState(false);
  const hasResolved = stats.totalResolved > 0;

  const streak = stats.streak ?? 0;
  const rolling10 = stats.rolling10 ?? 0;
  const rolling20 = stats.rolling20 ?? 0;
  const rolling50 = stats.rolling50 ?? 0;
  const drift = stats.calibrationDrift ?? 0;

  const streakIcon =
    streak > 0
      ? `${"🔥".repeat(Math.min(streak, 5))}`
      : streak < 0
        ? `${"❄️".repeat(Math.min(Math.abs(streak), 5))}`
        : "";

  const trendArrow =
    rolling10 > rolling20 + 3 ? "↑" : rolling10 < rolling20 - 3 ? "↓" : "→";

  const calibrationLabel =
    Math.abs(drift) < 2
      ? "Well-calibrated"
      : drift > 0
        ? `Adjusting: over-confident by ${drift}%`
        : `Adjusting: under-confident by ${Math.abs(drift)}%`;

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(34,197,94,0.03), rgba(34,197,94,0.015))",
        border: "1px solid rgba(34,197,94,0.08)",
        borderRadius: "12px",
        padding: "14px 18px",
        margin: "0 0 20px",
      }}
    >
      {/* Collapsed: Always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          width: "100%",
          textAlign: "center",
          padding: 0,
        }}
        aria-expanded={expanded}
        aria-label="Toggle learning engine details"
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: ".6rem",
              fontWeight: 700,
              letterSpacing: "3px",
              textTransform: "uppercase" as const,
              color: "#166534",
            }}
          >
            🧠 AI Learning Engine
          </span>
          <span
            style={{
              fontSize: ".7rem",
              color: "#22c55e",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
              display: "inline-block",
            }}
          >
            ▼
          </span>
        </div>

        {hasResolved ? (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: ".72rem",
              color: "#a3a3a3",
              marginTop: "6px",
            }}
          >
            <span
              style={{
                color:
                  stats.accuracy >= 60
                    ? "#22c55e"
                    : stats.accuracy >= 50
                      ? "#84cc16"
                      : "#ef4444",
                fontWeight: 700,
              }}
            >
              <CountUp target={stats.accuracy} suffix="%" />
            </span>{" "}
            accuracy &middot;{" "}
            <span style={{ color: "#22c55e", fontWeight: 700 }}>
              {stats.totalCorrect}W-{stats.totalResolved - stats.totalCorrect}L
            </span>{" "}
            {streakIcon && (
              <span style={{ marginLeft: "4px" }}>{streakIcon}</span>
            )}
          </div>
        ) : (
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: ".72rem",
              color: "#a3a3a3",
              marginTop: "6px",
            }}
          >
            <span style={{ color: "#22c55e", fontWeight: 700 }}>
              {stats.totalPredictions}
            </span>{" "}
            predictions queued &middot; Awaiting results to begin learning
          </div>
        )}
      </button>

      {/* Expanded: Detailed stats */}
      {expanded && hasResolved && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "12px",
            borderTop: "1px solid rgba(34,197,94,0.08)",
          }}
        >
          {/* Rolling Trend */}
          {(rolling10 > 0 || rolling20 > 0) && (
            <div
              style={{
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                marginBottom: "10px",
                flexWrap: "wrap",
              }}
            >
              {rolling10 > 0 && (
                <span style={{ fontSize: ".65rem", color: "#3a7a4e" }}>
                  Last 10:{" "}
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>
                    {rolling10}%
                  </span>
                </span>
              )}
              {rolling20 > 0 && (
                <span style={{ fontSize: ".65rem", color: "#3a7a4e" }}>
                  Last 20:{" "}
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>
                    {rolling20}%
                  </span>
                </span>
              )}
              {rolling50 > 0 && (
                <span style={{ fontSize: ".65rem", color: "#3a7a4e" }}>
                  Season:{" "}
                  <span style={{ color: "#22c55e", fontWeight: 700 }}>
                    {stats.accuracy}%
                  </span>
                </span>
              )}
              <span style={{ fontSize: ".65rem", color: "#3a7a4e" }}>
                Trend:{" "}
                <span
                  style={{
                    color:
                      trendArrow === "↑"
                        ? "#22c55e"
                        : trendArrow === "↓"
                          ? "#ef4444"
                          : "#84cc16",
                    fontWeight: 700,
                  }}
                >
                  {trendArrow}
                </span>
              </span>
            </div>
          )}

          {/* Streak */}
          {streak !== 0 && (
            <div
              style={{
                textAlign: "center",
                marginBottom: "8px",
                fontSize: ".65rem",
                color: "#3a7a4e",
              }}
            >
              {streak > 0
                ? `${streak}-match win streak ${streakIcon}`
                : `${Math.abs(streak)}-match losing streak ${streakIcon}`}
            </div>
          )}

          {/* Calibration */}
          <div
            style={{
              textAlign: "center",
              marginBottom: "10px",
              fontSize: ".6rem",
              color: "#3a7a4e",
            }}
          >
            Calibration: {calibrationLabel}
          </div>

          {/* Weight Evolution */}
          <div style={{ marginBottom: "10px" }}>
            <div
              style={{
                fontSize: ".55rem",
                color: "#166534",
                textTransform: "uppercase" as const,
                letterSpacing: "2px",
                marginBottom: "6px",
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              Factor Weights
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                justifyContent: "center",
              }}
            >
              {stats.weights.map((w) => {
                const defaultVal = DEFAULT_WEIGHTS[w.name] ?? 20;
                const diff = w.pct - defaultVal;
                const arrow = diff > 1 ? " ↑" : diff < -1 ? " ↓" : "";
                return (
                  <span
                    key={w.name}
                    style={{
                      fontSize: ".58rem",
                      color: "#3a7a4e",
                      background: "rgba(34,197,94,0.05)",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1px solid rgba(34,197,94,0.08)",
                    }}
                  >
                    {w.name}: {w.pct}%
                    {arrow && (
                      <span
                        style={{
                          color: arrow.includes("↑") ? "#22c55e" : "#ef4444",
                        }}
                      >
                        {arrow}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>

          {/* All Patterns */}
          {stats.patterns.length > 0 && (
            <div
              style={{
                marginTop: "8px",
                paddingTop: "8px",
                borderTop: "1px solid rgba(34,197,94,0.06)",
                textAlign: "left" as const,
              }}
            >
              <div
                style={{
                  fontSize: ".55rem",
                  color: "#166534",
                  textTransform: "uppercase" as const,
                  letterSpacing: "2px",
                  marginBottom: "6px",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                Patterns Detected ({stats.patterns.length})
              </div>
              {stats.patterns.map((p, i) => (
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
      )}

      {/* Collapsed: Minimal patterns */}
      {!expanded && stats.patterns.length > 0 && (
        <div
          style={{
            marginTop: "6px",
            fontSize: ".58rem",
            fontStyle: "italic",
            color: "#84cc16",
            letterSpacing: "1px",
            opacity: 0.85,
            textAlign: "center",
          }}
        >
          {stats.patternCount} patterns learned &middot; Tap to expand
        </div>
      )}
    </div>
  );
}
