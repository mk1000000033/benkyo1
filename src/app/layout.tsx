import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppHeader } from "@/components/AppHeader";
import { Decor } from "@/components/ui";

export const metadata: Metadata = {
  title: "みんなの薬学クイズ",
  description: "授業資料から作ったまとめとクイズで、楽しく薬学の試験対策",
  appleWebApp: { capable: true, title: "薬学クイズ", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="antialiased">
        <Decor />
        <AppHeader />
        <main className="mx-auto max-w-3xl px-4 pt-4 pb-[max(2.5rem,env(safe-area-inset-bottom))]">{children}</main>
      </body>
    </html>
  );
}
