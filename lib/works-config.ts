// Настраиваемые списки работ по направлениям (то, что раньше было константами
// в `works-catalog.ts`).
//
// `DEFAULT_WORKS_CONFIG` — значения по умолчанию из `works-catalog.ts`
// (источник — sources/Разбивка SEO по блокам работ.md). Актуальные списки
// администратор правит в разделе «Настройки → Работы направлений»; они лежат
// в БД (`app_settings`, ключ `works`) — см. `lib/settings.ts`.
//
// Название и цель направления через интерфейс не меняются: они завязаны на
// вёрстку слайдов и порядок сметы, поэтому берутся из `WORKS_CATALOG`.
//
// В КП попадает СНИМОК текстов (`Proposal.directions[].works`), сделанный в момент
// создания, — правка списка задним числом не меняет уже сохранённые КП.

import { DIRECTION_ORDER } from "./seo-config";
import { WORKS_CATALOG_BY_KEY, type DirectionCatalogEntry } from "./works-catalog";
import type { DirectionKey } from "./types";

/** Списки работ по направлениям: ключ направления → пункты каталога. */
export type WorksConfig = Record<DirectionKey, string[]>;

/** Ограничения (те же, что в `workItemSchema`, плюс потолок на длину списка). */
export const MAX_WORK_LENGTH = 1000;
export const MAX_WORKS_PER_DIRECTION = 100;

export const DEFAULT_WORKS_CONFIG: WorksConfig = Object.fromEntries(
  DIRECTION_ORDER.map((k) => [k, [...WORKS_CATALOG_BY_KEY[k].works]]),
) as WorksConfig;

/** Глубокая копия — чтобы правки черновика не задевали дефолты. */
export function cloneWorksConfig(cfg: WorksConfig): WorksConfig {
  return Object.fromEntries(
    DIRECTION_ORDER.map((k) => [k, [...cfg[k]]]),
  ) as WorksConfig;
}

/**
 * Нормализовать список работ одного направления: убрать пустые строки и дубли
 * (текст работы — её идентификатор в визарде: по нему ставится галочка, поэтому
 * два одинаковых пункта переключались бы вместе).
 */
function normalizeWorks(raw: unknown[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const text = item.trim().replace(/\s+/g, " ").slice(0, MAX_WORK_LENGTH);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text);
    if (out.length >= MAX_WORKS_PER_DIRECTION) break;
  }
  return out;
}

/**
 * Привести произвольный объект из БД к валидному `WorksConfig`: направление без
 * списка (новое или битое поле) получает список по умолчанию.
 *
 * Важно: явно сохранённый ПУСТОЙ массив так и остаётся пустым — «в этом
 * направлении нет предустановленных работ» отличается от «настройку не трогали».
 */
export function mergeWorksConfig(raw: unknown): WorksConfig {
  const isRecord =
    typeof raw === "object" && raw !== null && !Array.isArray(raw);
  const src = isRecord ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    DIRECTION_ORDER.map((k) => {
      const list = src[k];
      return [
        k,
        Array.isArray(list)
          ? normalizeWorks(list)
          : [...DEFAULT_WORKS_CONFIG[k]],
      ];
    }),
  ) as WorksConfig;
}

/**
 * Каталог направлений с работами из настроек: названия и цели — дефолтные
 * (`WORKS_CATALOG`), работы — из `config`. Это то, что видит визард.
 */
export function buildWorksCatalog(config: WorksConfig): DirectionCatalogEntry[] {
  return DIRECTION_ORDER.map((k) => ({
    ...WORKS_CATALOG_BY_KEY[k],
    works: [...config[k]],
  }));
}
