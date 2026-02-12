"use client";

import { useState } from "react";
import {
  Crown,
  Lock,
  CreditCard,
  Loader2,
  ArrowRight,
  Check,
  X,
  Zap,
  Target,
  TrendingUp,
  Trophy,
} from "lucide-react";

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
    <div className="court-bg grid-bg flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 shadow-lg shadow-lime-500/25">
            <Crown className="h-8 w-8 text-black" />
          </div>
          <h1 className="font-heading bg-gradient-to-r from-lime-300 via-emerald-400 to-lime-300 bg-clip-text text-4xl font-black tracking-wider text-transparent sm:text-5xl">
            ACE ORACLE
          </h1>
          <p className="mx-auto mt-4 max-w-md text-lg font-medium text-gray-300">
            AI Tennis Predictions for 99&cent;. Lifetime access.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            78% accuracy this season &middot; ATP, WTA &amp; Grand Slams
            &middot; Updated daily
          </p>
        </div>

        {/* Feature highlights */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { icon: Target, label: "78% Accuracy", sub: "This season" },
            { icon: Zap, label: "AI Predictions", sub: "Every match" },
            { icon: Trophy, label: "Lock of the Day", sub: "Top confidence" },
            {
              icon: TrendingUp,
              label: "Full Analysis",
              sub: "Factor breakdown",
            },
          ].map((f) => (
            <div
              key={f.label}
              className="glass-card flex flex-col items-center px-3 py-4 text-center"
            >
              <f.icon className="mb-2 h-5 w-5 text-lime-400" />
              <p className="text-sm font-bold text-white">{f.label}</p>
              <p className="text-[11px] text-gray-500">{f.sub}</p>
            </div>
          ))}
        </div>

        {/* Comparison Table */}
        <div className="glass-card mb-8 overflow-hidden">
          <div className="grid grid-cols-3 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Feature</span>
            <span className="text-center text-lime-400">Ace Oracle</span>
            <span className="text-center">Tennis Channel+</span>
          </div>
          <div className="divide-y divide-white/5">
            {[
              { feature: "AI Match Predictions", ace: true, tc: false },
              { feature: "Lock of the Day Picks", ace: true, tc: false },
              { feature: "Pick Tracking & History", ace: true, tc: false },
              { feature: "Factor Breakdown Analysis", ace: true, tc: false },
              { feature: "Leaderboard & Points", ace: true, tc: false },
              { feature: "Live Match Streaming", ace: false, tc: true },
              { feature: "Price", ace: "$0.99 once", tc: "$110/yr" },
            ].map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 items-center px-5 py-2.5 text-sm"
              >
                <span className="text-gray-400">{row.feature}</span>
                <span className="text-center">
                  {typeof row.ace === "boolean" ? (
                    row.ace ? (
                      <Check className="mx-auto h-4 w-4 text-lime-400" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-600" />
                    )
                  ) : (
                    <span className="font-bold text-lime-400">{row.ace}</span>
                  )}
                </span>
                <span className="text-center">
                  {typeof row.tc === "boolean" ? (
                    row.tc ? (
                      <Check className="mx-auto h-4 w-4 text-gray-400" />
                    ) : (
                      <X className="mx-auto h-4 w-4 text-gray-600" />
                    )
                  ) : (
                    <span className="text-gray-400">{row.tc}</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buy Access Card */}
        <div className="glass-card mb-4 p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
              <CreditCard className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Lifetime Access</h2>
              <p className="text-xs text-gray-500">
                One-time payment, forever yours
              </p>
            </div>
          </div>

          <div className="mb-5 flex items-baseline gap-2">
            <span className="text-5xl font-black text-white">$0.99</span>
            <span className="text-gray-500">one-time</span>
            <span className="ml-2 rounded-full bg-lime-500/15 px-2 py-0.5 text-xs font-semibold text-lime-400">
              Save $109/yr vs Tennis Channel+
            </span>
          </div>

          <button
            onClick={handleBuy}
            disabled={buyLoading}
            className="mb-3 w-full rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 py-3.5 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/25 disabled:opacity-50"
          >
            {buyLoading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "Get Lifetime Access — $0.99"
            )}
          </button>

          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-600">
            <span>Secure checkout via Stripe</span>
            <span>&middot;</span>
            <span>Instant access</span>
            <span>&middot;</span>
            <span>No recurring charges</span>
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        {/* Code Entry */}
        <div className="glass-card p-5">
          <div className="mb-3 flex items-center gap-3">
            <Lock className="h-4 w-4 text-lime-400" />
            <span className="text-sm font-semibold text-white">
              Got an access code?
            </span>
          </div>
          <form onSubmit={handleCodeSubmit} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium uppercase tracking-widest text-white placeholder-gray-600 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/25"
              aria-label="Access code"
            />
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 px-5 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/25 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowRight className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>

        {/* Cross-sells */}
        <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-5 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-600">
            Also from The 99&cent; Community
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              {
                name: "Gridiron Oracle",
                url: "https://gridiron-oracle.vercel.app",
              },
              { name: "Puck Prophet", url: "https://puck-prophet.vercel.app" },
              { name: "Hub", url: "https://the99community.vercel.app" },
            ].map((p) => (
              <a
                key={p.name}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-400 transition-all hover:border-white/20 hover:text-white"
              >
                {p.name} &middot; $0.99
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
