"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  if (pathname === "/gate") return null;

  return (
    <footer className="site-footer">
      <div className="footer-links">
        <a
          href="https://gridiron-oracle.ngrok.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Gridiron Oracle
        </a>
        <a
          href="https://puck-prophet.ngrok.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Puck Prophet
        </a>
        <a
          href="https://the99community.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-brand"
        >
          The 99&cent; Community
        </a>
      </div>
      <p className="footer-legal">
        &copy; {new Date().getFullYear()} Ace Oracle &middot; AI-generated
        predictions for entertainment purposes
      </p>
    </footer>
  );
}
