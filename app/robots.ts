import type { MetadataRoute } from "next";

/**
 * Внутренний инструмент — из поиска закрыт целиком.
 * Это только запрет обхода; индексацию запрещает заголовок `X-Robots-Tag`
 * (см. `headers()` в next.config.mjs) — он же работает для файлов из `/api`
 * (PDF/Excel), где HTML-мета негде разместить.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
