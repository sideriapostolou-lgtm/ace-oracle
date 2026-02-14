import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Ace Oracle | AI Tennis Predictions for $0.99",
  description:
    "Unlock AI-powered tennis predictions for ATP, WTA, and Grand Slam matches. One clear pick per match. $0.99 lifetime access — no subscriptions.",
  alternates: { canonical: "https://ace-oracle.vercel.app/gate" },
  openGraph: {
    title: "Ace Oracle — $0.99 Lifetime Access",
    description:
      "AI tennis predictions. One pick per match. No subscriptions. $0.99 once.",
  },
};

export default function GateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
