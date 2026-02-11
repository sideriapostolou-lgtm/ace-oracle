"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Crown } from "lucide-react";

const products = [
  {
    name: "Gridiron Oracle",
    desc: "NFL predictions",
    price: "$0.99",
    url: "https://gridiron-oracle.vercel.app",
  },
  {
    name: "Puck Prophet",
    desc: "NHL predictions",
    price: "$0.99",
    url: "https://puck-prophet.vercel.app",
  },
  {
    name: "BrandSnap",
    desc: "Brand kit generator",
    price: "$0.99",
    url: "https://brandforge-two.vercel.app",
  },
  {
    name: "SiteSnap",
    desc: "Website builder",
    price: "$0.99",
    url: "https://omega-web-factory.vercel.app",
  },
  {
    name: "SnapSafe",
    desc: "Food label scanner",
    price: "$0.99",
    url: "https://snapsafe-seven.vercel.app",
  },
];

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on gate page
  if (pathname === "/gate") return null;

  return (
    <footer className="border-t border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-lime-400 to-emerald-500">
                <Crown className="h-4 w-4 text-black" />
              </div>
              <span className="font-heading bg-gradient-to-r from-lime-300 to-emerald-400 bg-clip-text text-lg font-black tracking-wider text-transparent">
                ACE ORACLE
              </span>
            </div>
            <p className="text-sm text-gray-500">
              AI-powered tennis predictions. Pick winners, track your record,
              climb the leaderboard.
            </p>
            <p className="mt-3 text-xs text-gray-600">
              $0.99 lifetime access. No subscriptions.
            </p>
          </div>

          {/* Ace Oracle Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              Ace Oracle
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gray-400 transition-colors hover:text-lime-400"
                >
                  Today&apos;s Matches
                </Link>
              </li>
              <li>
                <Link
                  href="/leaderboard"
                  className="text-gray-400 transition-colors hover:text-lime-400"
                >
                  Leaderboard
                </Link>
              </li>
              <li>
                <Link
                  href="/picks"
                  className="text-gray-400 transition-colors hover:text-lime-400"
                >
                  My Picks
                </Link>
              </li>
              <li>
                <Link
                  href="/gate"
                  className="text-gray-400 transition-colors hover:text-lime-400"
                >
                  Get Access
                </Link>
              </li>
            </ul>
          </div>

          {/* 99c Community Products */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              The 99&cent; Community
            </h3>
            <ul className="space-y-2 text-sm">
              {products.map((p) => (
                <li key={p.name}>
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 transition-colors hover:text-lime-400"
                  >
                    {p.name}{" "}
                    <span className="text-gray-600">&middot; {p.price}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Community Hub */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-white">
              No Subscriptions. Ever.
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Every product is a one-time purchase. No monthly fees, no hidden
              charges, no BS.
            </p>
            <a
              href="https://the99community.vercel.app"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 px-4 py-2 text-sm font-bold text-black transition-opacity hover:opacity-90"
            >
              Visit The Hub
            </a>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-600">
          &copy; {new Date().getFullYear()} Ace Oracle. Part of{" "}
          <a
            href="https://the99community.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-lime-400"
          >
            The 99&cent; Community
          </a>
          . All predictions are AI-generated and for entertainment purposes.
        </div>
      </div>
    </footer>
  );
}
