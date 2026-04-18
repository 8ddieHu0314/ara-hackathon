import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Relay — one post, every platform",
  description:
    "Write once, publish everywhere. Per-platform AI tailoring, one-click distribution, unified analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="border-b border-[var(--card-border)] bg-[var(--background)]">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-[var(--background)] font-bold">
                R
              </div>
              <span className="text-lg font-semibold tracking-tight">Relay</span>
              <span className="ml-2 rounded-full border border-[var(--card-border)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                powered by ara
              </span>
            </Link>
            <nav className="flex gap-6 text-sm">
              <Link href="/" className="text-[var(--muted)] hover:text-white transition">
                Compose
              </Link>
              <Link href="/dashboard" className="text-[var(--muted)] hover:text-white transition">
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
