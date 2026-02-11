"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Trophy, Crown, Menu, X, Zap, History, LogIn } from "lucide-react";

const navItems = [
  { href: "/", label: "Today's Matches", icon: Zap },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/picks", label: "My Picks", icon: History },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide navbar on gate page
  if (pathname === "/gate") return null;

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lime-400 to-emerald-500 shadow-lg shadow-lime-500/25">
              <Crown className="h-5 w-5 text-black" />
            </div>
            <span className="font-heading bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-xl font-black tracking-wider text-transparent">
              ACE ORACLE
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-lime-500/15 text-lime-300"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {!session ? (
              <Link
                href="/login"
                className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:border-white/20 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Link>
            ) : (
              <span className="text-sm text-gray-400">
                {session.user?.name || session.user?.email}
              </span>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-gray-400 hover:text-white md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="border-t border-white/10 bg-black/95 backdrop-blur-xl md:hidden">
          <div className="space-y-1 px-4 py-4">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all",
                    isActive
                      ? "bg-lime-500/15 text-lime-300"
                      : "text-gray-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="mt-4 border-t border-white/10 pt-4">
              {!session ? (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300"
                >
                  <LogIn className="h-4 w-4" />
                  Sign In
                </Link>
              ) : (
                <span className="block text-center text-sm text-gray-400">
                  {session.user?.name || session.user?.email}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
