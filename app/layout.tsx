import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Генератор КП по SEO — Qmedia",
  description: "Внутренний инструмент Qmedia для подготовки коммерческих предложений по SEO",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <header className="bg-brand-gradient text-white shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-white.svg"
                alt="Qmedia"
                className="h-7 w-auto"
              />
            </a>
            <span className="text-white/40">·</span>
            <span className="text-white/90 text-sm font-medium">
              Генератор КП по SEO
            </span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
