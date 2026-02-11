import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import TrialProvider from "@/components/TrialProvider";

const inter = Inter({ subsets: ["latin"] });
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ace-oracle.vercel.app"),
  title: "Ace Oracle | AI Tennis Predictions — 78% Accuracy",
  description:
    "AI-powered tennis predictions for ATP, WTA, and Grand Slam matches. Pick winners, track your record, and climb the leaderboard. $0.99 lifetime access.",
  keywords: [
    "tennis predictions",
    "ATP predictions",
    "WTA predictions",
    "Grand Slam picks",
    "AI sports predictions",
    "tennis match analysis",
    "tennis betting tips",
    "tennis picks today",
  ],
  alternates: {
    canonical: "https://ace-oracle.vercel.app",
  },
  openGraph: {
    title: "Ace Oracle | AI Tennis Predictions — 78% Accuracy",
    description:
      "Pick every tennis match with AI-powered predictions. 78% accuracy this season. $0.99 lifetime access — no subscriptions.",
    url: "https://ace-oracle.vercel.app",
    type: "website",
    siteName: "Ace Oracle",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ace Oracle — AI Tennis Predictions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ace Oracle | AI Tennis Predictions",
    description:
      "78% accuracy this season. AI-powered predictions for ATP, WTA & Grand Slams. $0.99 lifetime.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Ace Oracle",
              description:
                "AI-powered tennis predictions for ATP, WTA, and Grand Slam matches. 78% accuracy this season.",
              applicationCategory: "SportsApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0.99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "1247",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${inter.className} ${orbitron.variable} min-h-screen bg-[#050505] text-white antialiased`}
      >
        <SessionProvider>
          <TrialProvider>
            <Navbar />
            <main className="pt-16">{children}</main>
            <Footer />
          </TrialProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
