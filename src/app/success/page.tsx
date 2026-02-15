"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SuccessPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for ace_access cookie
    const hasAccess = document.cookie
      .split("; ")
      .find((row) => row.startsWith("ace_access="));

    if (!hasAccess) {
      // No cookie — redirect to gate
      router.push("/gate");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div style={styles.loadingScreen}>
        <div style={styles.loadingSpinner}></div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Success checkmark */}
        <div style={styles.checkmarkWrapper}>
          <div style={styles.checkmark}>
            <svg
              width="60"
              height="60"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#22c55e"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
        </div>

        {/* Success message */}
        <h1 style={styles.title}>You&apos;re in.</h1>
        <p style={styles.subtitle}>
          Ace Oracle is unlocked forever. No subscriptions. Ever.
        </p>

        {/* Primary CTA */}
        <a href="/" style={styles.primaryCta}>
          See Today&apos;s Picks
        </a>

        {/* Divider */}
        <div style={styles.divider}>
          <div style={styles.dividerLine}></div>
        </div>

        {/* Cross-sell section */}
        <h2 style={styles.crossSellTitle}>🏀 Complete Your Tournament Arsenal</h2>
        <p style={styles.crossSellSubtitle}>
          March Madness is 19 days away - Don&apos;t bracket blind
        </p>

        <div style={styles.productGrid}>
          {/* Basketball Oracle - Priority */}
          <a
            href="https://march-oracle.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={{...styles.productCard, border: "1px solid rgba(251, 146, 60, 0.3)"}}
          >
            <div style={styles.productIcon}>🏀</div>
            <h3 style={styles.productName}>Basketball Oracle</h3>
            <p style={styles.productDesc}>March Madness AI predictions</p>
            <div style={{...styles.productPrice, color: "#f97316"}}>$0.99</div>
            <div style={{...styles.productCta, color: "#f97316"}}>Get March Madness Picks →</div>
            <div style={{fontSize: "0.6rem", color: "#dc2626", fontWeight: 700, textTransform: "uppercase", marginTop: "4px"}}>
              19 days to Selection Sunday!
            </div>
          </a>

          {/* Gridiron Oracle */}
          <a
            href="https://gridiron-oracle-next.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.productCard}
          >
            <div style={styles.productIcon}>🏈</div>
            <h3 style={styles.productName}>Gridiron Oracle</h3>
            <p style={styles.productDesc}>AI picks for every NFL game</p>
            <div style={styles.productPrice}>$0.99</div>
            <div style={styles.productCta}>Get NFL Picks →</div>
          </a>

          {/* Puck Prophet */}
          <a
            href="https://puck-prophet-next.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.productCard}
          >
            <div style={styles.productIcon}>🏒</div>
            <h3 style={styles.productName}>Puck Prophet</h3>
            <p style={styles.productDesc}>AI picks for every NHL game</p>
            <div style={styles.productPrice}>$0.99</div>
            <div style={styles.productCta}>Get NHL Picks →</div>
          </a>
        </div>

        {/* Bundle value prop */}
        <div style={styles.bundleBox}>
          <p style={styles.bundleText}>
            Tournament Arsenal Bundle: <strong>$3.96 → $2.97</strong> · All 4 AI tools · March Madness ready · No subscriptions
          </p>
        </div>

        {/* Hub link */}
        <div style={styles.hubLink}>
          <p style={styles.hubLabel}>Explore The 99¢ Community</p>
          <a
            href="https://the99community.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.hubCta}
          >
            Visit Hub
          </a>
        </div>
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    background: "#050505",
  },
  container: {
    maxWidth: "500px",
    width: "100%",
    textAlign: "center" as const,
    position: "relative" as const,
    zIndex: 10,
  },
  loadingScreen: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#050505",
  },
  loadingSpinner: {
    width: "40px",
    height: "40px",
    border: "3px solid rgba(34, 197, 94, 0.1)",
    borderTop: "3px solid #22c55e",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  checkmarkWrapper: {
    marginBottom: "32px",
    animation: "fadeInScale 0.6s ease-out",
  },
  checkmark: {
    width: "100px",
    height: "100px",
    margin: "0 auto",
    background: "rgba(34, 197, 94, 0.08)",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 60px rgba(34, 197, 94, 0.25)",
    border: "1px solid rgba(34, 197, 94, 0.15)",
  },
  title: {
    fontFamily: "var(--font-orbitron), Orbitron, sans-serif",
    fontSize: "clamp(2.5rem, 8vw, 3.5rem)",
    fontWeight: 900,
    color: "#ffffff",
    letterSpacing: "0.04em",
    marginBottom: "12px",
    lineHeight: 1,
  },
  subtitle: {
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "0.9rem",
    color: "#a3a3a3",
    marginBottom: "36px",
    lineHeight: 1.6,
  },
  primaryCta: {
    display: "inline-block",
    width: "100%",
    maxWidth: "340px",
    padding: "16px 28px",
    background: "#22c55e",
    color: "#000",
    fontFamily: "var(--font-orbitron), Orbitron, sans-serif",
    fontSize: "0.85rem",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.15em",
    borderRadius: "12px",
    textDecoration: "none",
    transition: "all 0.2s",
    boxShadow: "0 0 30px rgba(34, 197, 94, 0.2)",
  },
  divider: {
    margin: "48px 0 36px",
  },
  dividerLine: {
    height: "1px",
    background:
      "linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.2), transparent)",
  },
  crossSellTitle: {
    fontFamily: "var(--font-orbitron), Orbitron, sans-serif",
    fontSize: "1.4rem",
    fontWeight: 800,
    color: "#e5e5e5",
    marginBottom: "8px",
    letterSpacing: "0.06em",
  },
  crossSellSubtitle: {
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "0.75rem",
    color: "#737373",
    marginBottom: "28px",
    letterSpacing: "0.05em",
  },
  productGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "12px",
    marginBottom: "24px",
  },
  productCard: {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    padding: "24px 20px",
    textDecoration: "none",
    transition: "all 0.3s",
    display: "block",
  },
  productIcon: {
    fontSize: "2rem",
    marginBottom: "12px",
  },
  productName: {
    fontFamily: "var(--font-orbitron), Orbitron, sans-serif",
    fontSize: "0.85rem",
    fontWeight: 700,
    color: "#e5e5e5",
    marginBottom: "6px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  productDesc: {
    fontSize: "0.75rem",
    color: "#a3a3a3",
    marginBottom: "12px",
    lineHeight: 1.4,
  },
  productPrice: {
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "1.4rem",
    fontWeight: 900,
    color: "#22c55e",
    marginBottom: "10px",
  },
  productCta: {
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "0.65rem",
    color: "#22c55e",
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.1em",
  },
  bundleBox: {
    background: "rgba(34, 197, 94, 0.04)",
    border: "1px solid rgba(34, 197, 94, 0.12)",
    borderRadius: "12px",
    padding: "16px 20px",
    marginBottom: "32px",
  },
  bundleText: {
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "0.75rem",
    color: "#a3a3a3",
    margin: 0,
    letterSpacing: "0.02em",
  },
  hubLink: {
    paddingTop: "24px",
    borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  },
  hubLabel: {
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "0.65rem",
    color: "#737373",
    textTransform: "uppercase" as const,
    letterSpacing: "0.2em",
    marginBottom: "10px",
  },
  hubCta: {
    display: "inline-block",
    padding: "8px 20px",
    background: "transparent",
    color: "#a3a3a3",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "8px",
    fontFamily:
      "ui-monospace, SF Mono, Cascadia Code, Fira Code, Menlo, monospace",
    fontSize: "0.7rem",
    textDecoration: "none",
    transition: "all 0.2s",
    letterSpacing: "0.05em",
  },
};
