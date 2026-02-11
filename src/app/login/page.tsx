"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Crown, Loader2, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      name,
      redirect: false,
    });

    if (result?.error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="court-bg grid-bg flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-500 shadow-lg shadow-lime-500/25">
            <Crown className="h-7 w-7 text-black" />
          </div>
          <h1 className="text-3xl font-black">
            <span className="bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-transparent">
              Welcome to AceOracle
            </span>
          </h1>
          <p className="mt-2 text-gray-400">Sign in to start predicting</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-400"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-gray-600 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/25"
              />
            </div>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-400"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-600" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-white placeholder-gray-600 focus:border-lime-500/50 focus:outline-none focus:ring-1 focus:ring-lime-500/25"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full rounded-xl bg-gradient-to-r from-lime-400 to-emerald-500 py-3 text-sm font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/25 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="mx-auto h-5 w-5 animate-spin" />
              ) : (
                "Sign In & Start Predicting"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-600">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
