"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function GatePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (data.success) {
        window.location.href = "/";
      } else {
        setError(data.error || "Invalid code. Try again or buy access below.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    setBuyLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError("Failed to start checkout. Please try again.");
        setBuyLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setBuyLoading(false);
    }
  };

  return (
    <div className="gate-page">
      <div className="gate-box">
        {/* Social proof badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            background: "rgba(34, 197, 94, 0.06)",
            border: "1px solid rgba(34, 197, 94, 0.12)",
            borderRadius: "20px",
            marginBottom: "20px",
            fontSize: "0.65rem",
            fontFamily: "var(--mono)",
            color: "#a3a3a3",
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              background: "#22c55e",
              borderRadius: "50%",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
          Trusted by tennis fans worldwide
        </div>

        <h1 className="font-heading">ACE ORACLE</h1>
        <p className="subtitle">AI Tennis Predictions</p>

        {/* Price card */}
        <div className="price-card">
          {/* Price anchor */}
          <div
            style={{
              marginBottom: "8px",
              fontSize: "0.75rem",
              fontFamily: "var(--mono)",
              color: "#737373",
              letterSpacing: "0.05em",
            }}
          >
            <span
              style={{
                textDecoration: "line-through",
                opacity: 0.5,
                marginRight: "6px",
              }}
            >
              $30/mo
            </span>
            <span style={{ color: "#22c55e", fontWeight: 600 }}>
              vs our 99¢ one-time
            </span>
          </div>

          <div className="price-amount">$0.99</div>
          <div className="price-period">One-time &middot; Lifetime access</div>
          <button
            onClick={handleBuy}
            disabled={buyLoading}
            className="gate-btn gate-btn-primary"
          >
            {buyLoading ? (
              <Loader2
                className="mx-auto animate-spin"
                style={{ width: 18, height: 18 }}
              />
            ) : (
              "Unlock Winning Picks"
            )}
          </button>

          {/* Trust signals */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "16px",
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              style={{
                fontSize: "0.6rem",
                fontFamily: "var(--mono)",
                color: "#737373",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                letterSpacing: "0.05em",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              Stripe Secure
            </div>
            <div
              style={{
                fontSize: "0.6rem",
                fontFamily: "var(--mono)",
                color: "#737373",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                letterSpacing: "0.05em",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Lifetime Access
            </div>
            <div
              style={{
                fontSize: "0.6rem",
                fontFamily: "var(--mono)",
                color: "#737373",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                letterSpacing: "0.05em",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
              </svg>
              No Subscriptions
            </div>
          </div>

          {/* Guarantee */}
          <div
            style={{
              marginTop: "14px",
              fontSize: "0.65rem",
              fontFamily: "var(--mono)",
              color: "#737373",
              fontStyle: "italic",
              letterSpacing: "0.02em",
            }}
          >
            Not happy? Full refund, no questions.
          </div>
        </div>

        {/* Divider */}
        <div className="gate-divider">
          <span>or</span>
        </div>

        {/* Code entry */}
        <div className="code-card">
          <h3>Have a code?</h3>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleCodeSubmit}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="ENTER CODE"
              className="gate-input"
              autoComplete="off"
              aria-label="Access code"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="gate-btn gate-btn-secondary"
            >
              {loading ? (
                <Loader2
                  className="mx-auto animate-spin"
                  style={{ width: 18, height: 18 }}
                />
              ) : (
                "Unlock"
              )}
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="gate-features">
          {[
            "AI match predictions with win probabilities",
            "Lock of the Day — highest confidence pick",
            "Sharp bullet-point analysis per match",
            "ATP, WTA & Grand Slam coverage",
          ].map((feature, i) => (
            <div key={i} className="feature">
              <span className="feature-dot" />
              {feature}
            </div>
          ))}
        </div>

        {/* Cross-sells */}
        <div className="cross-sell">
          <div className="cross-sell-label">The 99&cent; Community</div>
          <div className="cross-sell-links">
            <a
              href="https://gridiron-oracle-next.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gridiron Oracle
            </a>
            <a
              href="https://puck-prophet-next.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Puck Prophet
            </a>
            <a
              href="https://the99community.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Hub
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
