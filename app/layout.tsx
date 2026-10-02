import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "会津感染症ポスター作成 | 会喜地域薬局グループ",
  description: "福島県感染症週報の最新値から、会津地域の待合室向け感染症ポスターを自動作成します。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
