import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import SessionProvider from "@/components/SessionProvider";
import TrialProvider from "@/components/TrialProvider";

const inter = Inter({ subsets: ["latin"] });
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "AceOracle | AI Tennis Predictions",
  description:
    "AI-powered tennis predictions for ATP, WTA, and Grand Slam matches. Pick winners, track your record, and climb the leaderboard.",
  keywords: [
    "tennis",
    "predictions",
    "ATP",
    "WTA",
    "Grand Slam",
    "AI",
    "sports betting",
    "match analysis",
  ],
  openGraph: {
    title: "AceOracle | AI Tennis Predictions",
    description:
      "Pick every tennis match with AI-powered predictions. 78% accuracy this season.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} ${orbitron.variable} min-h-screen bg-[#050505] text-white antialiased`}
      >
        <SessionProvider>
          <TrialProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
          </TrialProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
