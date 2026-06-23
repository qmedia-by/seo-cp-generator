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
        <header className="bg-brand-black text-white">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <a href="/" className="flex items-center gap-2">
              <span className="grid place-items-center h-7 w-7 rounded-full bg-brand-yellow text-brand-black font-extrabold">
                Q
              </span>
              <span className="font-bold">Qmedia</span>
            </a>
            <span className="text-white/40">·</span>
            <span className="text-white/80 text-sm">Генератор КП по SEO</span>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}
