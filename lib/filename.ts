// Заголовок Content-Disposition с поддержкой кириллицы (RFC 5987).

export function contentDisposition(
  filename: string,
  type: "attachment" | "inline" = "attachment",
): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  const encoded = encodeURIComponent(filename);
  return `${type}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}

/** Базовое имя файла КП без расширения. */
export function proposalFileBase(siteName: string, createdAt: string): string {
  const safeSite = (siteName || "site").replace(/[^\p{L}\p{N}._-]+/gu, "-");
  const date = createdAt.slice(0, 10);
  return `КП-SEO-${safeSite}-${date}`;
}
