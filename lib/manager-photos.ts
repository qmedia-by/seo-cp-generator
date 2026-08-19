// Фото менеджеров: разбор data-URL из формы настроек и отпечаток файла.
//
// Сами байты живут в отдельной таблице `manager_photos`, а не в jsonb со
// справочником: список менеджеров читается на каждый рендер визарда и уезжает
// в браузер пропсами — тащить туда мегабайты base64 незачем. В самом
// справочнике остаётся только `Manager.photoVersion`: признак «фото есть» плюс
// метка версии, которой в URL сбрасывается кэш браузера.
//
// Модуль серверный (использует `node:crypto` и `Buffer`) — из клиентских
// компонентов его не импортировать.

import { createHash } from "node:crypto";

/** Что принимаем: фото менеджера — обычная растровая картинка. */
export const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

/** Потолок на один файл (после декодирования): аватарка с сайта — ~50 КБ. */
export const MAX_PHOTO_BYTES = 1_000_000;

/** Одно фото: MIME из белого списка + содержимое (в БД уходит как bytea). */
export interface ManagerPhoto {
  mime: string;
  base64: string;
}

/**
 * Отпечаток файла: метка версии в URL картинки и признак «фото изменилось»
 * при синхронизации с сайтом. Не криптография — просто короткий стабильный
 * идентификатор содержимого.
 */
export function photoVersion(photo: ManagerPhoto): string {
  return createHash("sha1").update(photo.base64).digest("hex").slice(0, 16);
}

const DATA_URL = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i;

/**
 * Разобрать data-URL из браузера в `ManagerPhoto`. Бросает ошибку с текстом,
 * который не стыдно показать пользователю.
 */
export function parsePhotoDataUrl(input: unknown): ManagerPhoto {
  if (typeof input !== "string" || input.trim() === "") {
    throw new Error("Не передано изображение");
  }
  const m = DATA_URL.exec(input.trim());
  if (!m) {
    throw new Error("Ожидается data-URL вида data:image/jpeg;base64,…");
  }

  const mime = m[1].toLowerCase();
  if (!(PHOTO_MIME as readonly string[]).includes(mime)) {
    throw new Error(`Формат ${mime} не поддерживается: нужен JPEG, PNG или WebP`);
  }

  const bytes = Buffer.from(m[2].replace(/\s+/g, ""), "base64");
  if (bytes.length === 0) throw new Error("Файл пустой");
  if (bytes.length > MAX_PHOTO_BYTES) {
    throw new Error(
      `Файл больше ${Math.round(MAX_PHOTO_BYTES / 1000)} КБ — уменьшите фото`,
    );
  }

  // Перекодируем через Buffer: браузер может прислать base64 с переносами или
  // нестандартным паддингом, а от этой строки считается отпечаток версии.
  return { mime, base64: bytes.toString("base64") };
}
