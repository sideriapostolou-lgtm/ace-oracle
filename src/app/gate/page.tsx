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
        <h1 className="font-heading">ACE ORACLE</h1>
        <p className="subtitle">AI Tennis Predictions</p>

        {/* Price card */}
        <div className="price-card">
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
              "Get Access"
            )}
          </button>
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
              href="https://gridiron-oracle.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Gridiron Oracle
            </a>
            <a
              href="https://puck-prophet.vercel.app"
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
