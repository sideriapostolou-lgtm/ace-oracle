import type { Metadata } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
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
  title: "Ace Oracle | AI Tennis Predictions",
  description:
    "AI-powered tennis predictions for ATP, WTA, and Grand Slam matches. One clear pick per match. $0.99 lifetime access.",
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
    title: "Ace Oracle | AI Tennis Predictions",
    description:
      "One clear pick per match. AI-powered tennis predictions. $0.99 lifetime access.",
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
      "One clear pick per match. AI-powered predictions for ATP, WTA & Grand Slams. $0.99 lifetime.",
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
                "AI-powered tennis predictions for ATP, WTA, and Grand Slam matches.",
              applicationCategory: "SportsApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0.99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock",
              },
            }),
          }}
        />
      </head>
      <body className={`${inter.className} ${orbitron.variable}`}>
        <SessionProvider>
          <TrialProvider>
            <main>{children}</main>
            <Footer />
          </TrialProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
