"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface ProGateProps {
  children: React.ReactNode;
  feature: string;
}

export default function ProGate({ children, feature }: ProGateProps) {
  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-sm">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="glass-card px-6 py-4 text-center">
          <Lock className="mx-auto mb-2 h-6 w-6 text-amber-400" />
          <p className="mb-1 text-sm font-semibold text-white">
            {feature} requires access
          </p>
          <p className="mb-3 text-xs text-gray-400">
            Get lifetime access for just $0.99
          </p>
          <Link
            href="/gate"
            className="inline-block rounded-lg bg-gradient-to-r from-lime-400 to-emerald-500 px-4 py-2 text-xs font-bold text-black transition-all hover:shadow-lg hover:shadow-lime-500/25"
          >
            Get Access — $0.99
          </Link>
        </div>
      </div>
    </div>
  );
}
