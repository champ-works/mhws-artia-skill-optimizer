import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Artian Weapon Skill Roll Tracker | MHWilds / 巨戟アーティアスキル厳選補助ツール",
  description: "Monster Hunter Wilds Artian weapon skill roll tracker. Auto-read skills from screenshots, search by skill name, track reroll history. Mobile & PC friendly, no install needed. / モンスターハンターワイルズ アーティア武器スキル厳選補助ツール。スクショOCR自動記録・スキル検索対応。",
  keywords: [
    "Monster Hunter Wilds", "MHWilds", "Artian", "Artian weapon", "skill tracker", "roll tracker",
    "Gogmapocalypse", "Artian skills", "MHWs tool", "reroll tracker",
    "モンスターハンターワイルズ", "MHWs", "アーティア", "スキル厳選", "巨戟", "武器", "ツール",
  ],
  verification: {
    google: "Ys1cFoLHlir72ZiYxURZmYzk62hkDlK2Ca2ZHQ1lsjg",
  },
  openGraph: {
    title: "Artian Weapon Skill Roll Tracker | MHWilds",
    description: "Track your Artian weapon rerolls in Monster Hunter Wilds. Auto-read skills from screenshots, search by skill, mobile-friendly, free.",
    type: "website",
    locale: "en_US",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<Analytics /></body>
    </html>
  );
}
