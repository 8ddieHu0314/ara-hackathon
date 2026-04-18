import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Signal — one post, every platform",
  description:
    "Write once, publish everywhere. Per-platform AI tailoring, one-click distribution, unified analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="sticky top-0 z-20 border-b border-[var(--card-border)] bg-[var(--background)]/80 backdrop-blur-xl">
          <div className="flex w-full items-center justify-between px-12 py-4">
            <Link href="/" className="group flex items-center gap-3">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-[#0a0a0b] font-bold shadow-[0_0_20px_rgba(249,115,22,0.35)] transition-transform group-hover:scale-105">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 12c0-5 4-9 9-9s9 4 9 9"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M7 12c0-3 2-5 5-5s5 2 5 5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="12" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold leading-none tracking-tight">
                  Signal
                </span>
                <span className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">
                  powered by ara
                </span>
              </div>
            </Link>
            <nav className="flex items-center gap-1 rounded-full border border-[var(--card-border)] bg-[var(--card)] p-1 text-sm">
              <Link
                href="/"
                className="rounded-full px-4 py-1.5 text-[var(--muted)] transition hover:text-white"
              >
                Compose
              </Link>
              <Link
                href="/dashboard"
                className="rounded-full px-4 py-1.5 text-[var(--muted)] transition hover:text-white"
              >
                Dashboard
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-[var(--card-border)] py-6 text-center text-xs text-[var(--muted)]">
          Write once. Publish everywhere. Built on Ara.
        </footer>
      </body>
    </html>
  );
}
