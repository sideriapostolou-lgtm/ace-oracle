"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Crown, Clock, Loader2, ArrowRight } from "lucide-react";

const TRIAL_DURATION_MS = 10 * 60 * 1000; // 10 minutes
const TRIAL_KEY = "ace_trial_start";

interface TrialContextValue {
  hasFullAccess: boolean;
  trialActive: boolean;
  trialExpired: boolean;
  remainingMs: number;
}

const TrialContext = createContext<TrialContextValue>({
  hasFullAccess: true,
  trialActive: false,
  trialExpired: false,
  remainingMs: 0,
});

export const useTrial = () => useContext(TrialContext);

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function TrialProvider({ children }: { children: React.ReactNode }) {
  const [hasPaid, setHasPaid] = useState<boolean | null>(null); // null = loading
  const [trialStart, setTrialStart] = useState<number | null>(null);
  const [remainingMs, setRemainingMs] = useState(TRIAL_DURATION_MS);
  const [showPaywall, setShowPaywall] = useState(false);

  // Check paid status on mount
  useEffect(() => {
    const paid = getCookie("ace_access") === "granted";
    setHasPaid(paid);

    if (!paid) {
      // Initialize or retrieve trial
      const stored = localStorage.getItem(TRIAL_KEY);
      if (stored) {
        setTrialStart(parseInt(stored, 10));
      } else {
        const now = Date.now();
        localStorage.setItem(TRIAL_KEY, now.toString());
        setTrialStart(now);
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (hasPaid || trialStart === null) return;

    const tick = () => {
      const elapsed = Date.now() - trialStart;
      const remaining = TRIAL_DURATION_MS - elapsed;
      setRemainingMs(remaining);
      if (remaining <= 0) {
        setShowPaywall(true);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [hasPaid, trialStart]);

  // Still loading
  if (hasPaid === null) return <>{children}</>;

  // Paid user — no trial UI
  if (hasPaid) {
    return (
      <TrialContext.Provider value={{ hasFullAccess: true, trialActive: false, trialExpired: false, remainingMs: 0 }}>
        {children}
      </TrialContext.Provider>
    );
  }

  const trialActive = !showPaywall && remainingMs > 0;
  const trialExpired = showPaywall || remainingMs <= 0;

  return (
    <TrialContext.Provider value={{ hasFullAccess: !trialExpired, trialActive, trialExpired, remainingMs }}>
      {/* Countdown timer bar */}
      {trialActive && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-lime-500/20 bg-[#0a0a0a]/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Clock className="h-4 w-4 text-lime-400" />
              <span>Free trial</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-heading text-lg font-bold tabular-nums text-lime-400">
                {formatTime(remainingMs)}
              </span>
              <a
                href="/gate"
                className="rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 px-3 py-1.5 text-xs font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/25"
              >
                Get Lifetime Access — $0.99
              </a>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-0.5 bg-white/5">
            <div
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-500 transition-all duration-1000"
              style={{ width: `${Math.max(0, (remainingMs / TRIAL_DURATION_MS) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {children}

      {/* Paywall overlay */}
      {trialExpired && <PaywallOverlay />}
    </TrialContext.Provider>
  );
}

function PaywallOverlay() {
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
        window.location.reload();
      } else {
        setError(data.error || "Invalid code");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong");
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
        setError("Failed to start checkout");
        setBuyLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setBuyLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-8 shadow-2xl shadow-lime-500/5">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 shadow-lg shadow-lime-500/25">
              <Crown className="h-7 w-7 text-black" />
            </div>
            <h2 className="font-heading mb-2 text-2xl font-black tracking-wide text-white">
              Trial Ended
            </h2>
            <p className="text-sm text-gray-400">
              Your free trial has ended. Get lifetime access for just $0.99 — less than a coffee ☕
            </p>
          </div>

          {/* Buy Button */}
          <button
            onClick={handleBuy}
            disabled={buyLoading}
            className="mb-4 w-full rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 py-3.5 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/25 disabled:opacity-50"
          >
            {buyLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "Get Lifetime Access — $0.99"
            )}
          </button>

          {/* Features */}
          <ul className="mb-5 space-y-1.5">
            {[
              "All AI-powered predictions",
              "Lock of the Day picks",
              "Full analysis & pick tracking",
              "Lifetime access — pay once",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                <span className="h-1 w-1 rounded-full bg-lime-400" />
                {f}
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">or enter code</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Code input */}
          <form onSubmit={handleCodeSubmit} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Access code"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium uppercase tracking-widest text-white placeholder-gray-600 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/25"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="rounded-lg bg-white/10 px-4 py-2.5 text-white transition-all hover:bg-white/20 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
