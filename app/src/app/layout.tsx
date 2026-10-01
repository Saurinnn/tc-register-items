import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "リサーチ抽出ツール",
  description: "リサーチ結果のHTMLから ASIN・楽天情報・利益を抽出して表にします",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
