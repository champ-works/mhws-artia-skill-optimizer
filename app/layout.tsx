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
  title: "巨戟アーティアスキル厳選補助ツール | MHWs",
  description: "モンスターハンターワイルズ（MHWs）の巨戟アーティア武器スキル厳選をサポート。スクショOCRで自動記録、スキル検索、統計表示に対応。スマホ・PC両対応。",
  keywords: ["モンスターハンターワイルズ", "MHWs", "アーティア", "スキル厳選", "巨戟", "武器", "ツール"],
  openGraph: {
    title: "巨戟アーティアスキル厳選補助ツール | MHWs",
    description: "MHWsのアーティア武器スキル厳選をサポート。スクショ自動読み取り・スキル検索対応。",
    type: "website",
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
