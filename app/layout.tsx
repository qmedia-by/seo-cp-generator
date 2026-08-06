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
            <a
              href="/settings"
              title="Настройки"
              className="ml-auto flex items-center gap-2 rounded-lg border border-white/40 px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/15 hover:text-white"
            >
              <GearIcon />
              <span className="hidden sm:inline">Настройки</span>
            </a>
          </div>
        </header>
        <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
      </body>
    </html>
  );
}

/** Шестерёнка (outline, 24×24) — иконок в проекте нет, рисуем инлайном. */
function GearIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
