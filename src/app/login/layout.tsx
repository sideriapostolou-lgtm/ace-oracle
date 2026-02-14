import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login | Ace Oracle",
  description: "Log in to access your AI-powered tennis predictions.",
  robots: { index: false, follow: true },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
