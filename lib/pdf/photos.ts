// Фото менеджеров для PDF.
//
// Байты живут в таблице `manager_photos` (ключ — id менеджера в справочнике),
// а в КП хранится только ссылка — `ProposalManager.id`. Снимок картинки в
// jsonb КП не кладём: `proposals.data` читается целиком в списке КП, а две
// аватарки — это ~100 КБ на каждое предложение. Побочный эффект осознан: если
// фото менеджера заменят, в старом КП при повторном скачивании PDF будет
// новое фото (цифры и тексты при этом остаются снимком).
//
// Модуль серверный: тянет БД. Грузить фото нужно ДО рендера и передавать в
// `ProposalDocument` пропсом — сам документ синхронный.

import { getManagerPhoto } from "../settings";
import type { ProposalManager } from "../types";

/** Картинка в том виде, в котором её принимает `<Image src>` react-pdf. */
export interface PdfPhoto {
  data: Buffer;
  format: "png" | "jpg";
}

/** Фото участников КП: подготовивший менеджер и Project-менеджер. */
export interface ProposalPhotos {
  manager?: PdfPhoto;
  projectManager?: PdfPhoto;
}

/**
 * react-pdf понимает только PNG и JPEG. В `manager_photos` может лежать WebP
 * (белый список MIME его допускает) — такое фото просто не показываем, вместо
 * него отрисуются инициалы.
 */
function toPdfFormat(mime: string): PdfPhoto["format"] | null {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  return null;
}

async function load(manager?: ProposalManager): Promise<PdfPhoto | undefined> {
  if (!manager?.id) return undefined;
  try {
    const stored = await getManagerPhoto(manager.id);
    if (!stored) return undefined;
    const format = toPdfFormat(stored.mime);
    return format ? { data: stored.bytes, format } : undefined;
  } catch (err) {
    // Недоступная БД не должна ронять выгрузку PDF — обойдёмся инициалами.
    console.warn("Не удалось прочитать фото менеджера:", err);
    return undefined;
  }
}

/** Подтянуть фото обоих менеджеров КП. Чего нет — того нет, это не ошибка. */
export async function loadProposalPhotos(
  manager?: ProposalManager,
  projectManager?: ProposalManager,
): Promise<ProposalPhotos> {
  const [managerPhoto, pmPhoto] = await Promise.all([
    load(manager),
    load(projectManager),
  ]);
  return { manager: managerPhoto, projectManager: pmPhoto };
}
