// Синхронизация справочника менеджеров с сайта qmedia.by.
//
// Единый источник истины по менеджерам — блок «Персональные менеджеры»
// (`ul.contact__list`) на https://www.qmedia.by/kontakty.html. Отсюда берём
// имя, должность, телефон и email; мессенджеры игнорируем.
//
// Парсим регулярками, без cheerio/jsdom: вёрстка блока простая и стабильная,
// тянуть парсер HTML в зависимости ради одного списка незачем. Если вёрстка
// всё-таки поменяется — `fetchQmediaManagers` упадёт с внятной ошибкой
// («блок не найден»), а не тихо сотрёт справочник.
//
// Должность видимой разметкой не выводится — она лежит в атрибуте
// `data-profile` у `.contact-manager` (добавлен на сайт специально под эту
// синхронизацию). Карточка без атрибута — не ошибка: `role` тогда остаётся
// прежним (см. `mergeManagersFromSite`).

import type { Manager } from "./types";

export const QMEDIA_CONTACTS_URL = "https://www.qmedia.by/kontakty.html";

/** Данные одного менеджера, вычитанные с сайта. */
export interface SiteManager {
  name: string;
  /** Должность из `data-profile` («IT account-менеджер»). */
  role: string;
  phone: string;
  email: string;
}

/** Что даст синхронизация (имена для показа пользователю). */
export interface ManagersSyncSummary {
  /** Есть на сайте, не было у нас. */
  added: string[];
  /** Есть у обоих, данные разошлись. */
  updated: string[];
  /** Было у нас, на сайте нет. */
  removed: string[];
  /** Совпали полностью. */
  unchanged: string[];
}

/** Сводка + готовый список для сохранения. */
export interface ManagersSyncPlan extends ManagersSyncSummary {
  managers: Manager[];
}

// --- Парсинг ---

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, code: string) => {
    if (code[0] === "#") {
      const num =
        code[1] === "x" || code[1] === "X"
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
      return Number.isFinite(num) ? String.fromCodePoint(num) : full;
    }
    return ENTITIES[code.toLowerCase()] ?? full;
  });
}

/** Текст из куска разметки: снять теги, развернуть сущности, схлопнуть пробелы. */
function text(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Вырезать содержимое `ul.contact__list` — со счётчиком вложенности, потому что
 * внутри карточек есть свои `<ul>` (список контактов и мессенджеры). Без счётчика
 * блок оборвался бы на первом же вложенном `</ul>`.
 */
function sliceContactList(html: string): string | null {
  const start = html.search(/<ul[^>]*\bclass="[^"]*\bcontact__list\b[^"]*"/i);
  if (start < 0) return null;

  const tags = /<ul\b|<\/ul\s*>/gi;
  tags.lastIndex = start;
  let depth = 0;
  let m: RegExpExecArray | null;
  while ((m = tags.exec(html)) !== null) {
    if (m[0][1] === "/") {
      depth -= 1;
      if (depth === 0) return html.slice(start, m.index);
    } else {
      depth += 1;
    }
  }
  return null;
}

/**
 * Привести телефон к виду `+375 (29) 335-23-23` (как в `COMPANY.manager`).
 * На сайте формат «плавает»: `+375 29` / `+375 (29)`, `635-25-13` / `6352323`,
 * поэтому берём цифры из `href="tel:"` и форматируем сами. Не-белорусские
 * номера отдаём как есть.
 */
export function formatQmediaPhone(raw: string): string {
  const digits = decodeEntities(raw).replace(/[^\d+]/g, "");
  const by = /^\+?375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(digits);
  if (by) return `+375 (${by[1]}) ${by[2]}-${by[3]}-${by[4]}`;
  return text(raw);
}

/**
 * Разобрать HTML страницы контактов в список менеджеров.
 *
 * Порядок карточек сайт тасует при каждой загрузке (проверено: два подряд
 * запроса дают разную выдачу), поэтому на него опираться нельзя — итоговый
 * порядок задаёт `mergeManagersFromSite`.
 */
export function parseQmediaManagers(html: string): SiteManager[] {
  const list = sliceContactList(html);
  if (!list) return [];

  // Первый кусок — разметка до первой карточки, он отбрасывается.
  const cards = list
    .split(/<li[^>]*\bclass="[^"]*\bcontact__list-point\b[^"]*"[^>]*>/i)
    .slice(1);

  const out: SiteManager[] = [];
  const seen = new Set<string>();

  for (const card of cards) {
    const nameHtml = /\bclass="[^"]*\bcontact-manager__title\b[^"]*"[^>]*>([\s\S]*?)<\//i.exec(
      card,
    );
    const name = nameHtml ? text(nameHtml[1]) : "";
    if (!name) continue;

    const key = normalizeName(name);
    if (seen.has(key)) continue;
    seen.add(key);

    // Ссылки мессенджеров — `viber://`/`whatsapp://`/`https://telegram.me`,
    // под `tel:` попадают только телефоны. Актуальным считаем последний
    // (первый у всех общий — номер офиса).
    const phones = [...card.matchAll(/href="tel:([^"]+)"/gi)].map((p) => p[1]);
    const email = /href="mailto:([^"?]+)/i.exec(card);
    const role = /\bdata-profile="([^"]*)"/i.exec(card);

    out.push({
      name,
      role: role ? text(role[1]) : "",
      phone: phones.length ? formatQmediaPhone(phones[phones.length - 1]) : "",
      email: email ? decodeEntities(email[1]).trim() : "",
    });
  }

  return out;
}

/** Скачать и разобрать страницу контактов. Бросает ошибку с понятным текстом. */
export async function fetchQmediaManagers(
  url: string = QMEDIA_CONTACTS_URL,
): Promise<SiteManager[]> {
  let html: string;
  try {
    const res = await fetch(url, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "qmedia-seo-cp-generator/1.0",
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) throw new Error(`сайт ответил ${res.status}`);
    html = await res.text();
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(`Не удалось загрузить ${url}: ${reason}`);
  }

  const managers = parseQmediaManagers(html);
  if (managers.length === 0) {
    throw new Error(
      "На странице не найден блок менеджеров (.contact__list) — похоже, изменилась вёрстка сайта. Справочник не тронут.",
    );
  }
  return managers;
}

// --- Слияние со справочником ---

/** Ключ сопоставления — «Имя Фамилия» без регистра, лишних пробелов и ё/е. */
export function normalizeName(name: string): string {
  return name.replace(/\s+/g, " ").trim().toLowerCase().replace(/ё/g, "е");
}

/**
 * Наложить данные сайта на текущий справочник: сайт — главный источник.
 *
 * - есть у обоих → обновляем имя/должность/телефон/email, сохраняем `id`;
 * - есть только на сайте → добавляем;
 * - есть только у нас → удаляем;
 * - результат сортируется по имени: порядок карточек на сайте случайный, и
 *   без сортировки справочник перетасовывался бы на каждой синхронизации.
 *
 * Пустое значение с сайта (в карточке не указаны должность, телефон или email)
 * **не** затирает заполненное у нас: это почти наверняка пробел в данных сайта,
 * а не решение «контакт удалить».
 */
export function mergeManagersFromSite(
  current: Manager[],
  site: SiteManager[],
  newId: () => string = () => crypto.randomUUID(),
): ManagersSyncPlan {
  const byName = new Map<string, Manager>();
  for (const m of current) {
    const key = normalizeName(m.name);
    if (!byName.has(key)) byName.set(key, m);
  }

  const plan: ManagersSyncPlan = {
    managers: [],
    added: [],
    updated: [],
    removed: [],
    unchanged: [],
  };
  const matched = new Set<string>();

  for (const s of site) {
    const key = normalizeName(s.name);
    const existing = byName.get(key);
    if (!existing) {
      plan.managers.push({
        id: newId(),
        name: s.name,
        role: s.role,
        phone: s.phone,
        email: s.email,
      });
      plan.added.push(s.name);
      continue;
    }

    matched.add(key);
    const next: Manager = {
      ...existing,
      name: s.name,
      role: s.role || existing.role,
      phone: s.phone || existing.phone,
      email: s.email || existing.email,
    };
    plan.managers.push(next);
    if (
      next.name !== existing.name ||
      next.role !== existing.role ||
      next.phone !== existing.phone ||
      next.email !== existing.email
    ) {
      plan.updated.push(s.name);
    } else {
      plan.unchanged.push(s.name);
    }
  }

  for (const m of current) {
    if (!matched.has(normalizeName(m.name))) plan.removed.push(m.name);
  }

  const byRu = (a: string, b: string) => a.localeCompare(b, "ru");
  plan.managers.sort((a, b) => byRu(a.name, b.name));
  plan.added.sort(byRu);
  plan.updated.sort(byRu);
  plan.removed.sort(byRu);
  plan.unchanged.sort(byRu);

  return plan;
}

/** Есть ли вообще что применять. */
export function hasChanges(summary: ManagersSyncSummary): boolean {
  return (
    summary.added.length > 0 ||
    summary.updated.length > 0 ||
    summary.removed.length > 0
  );
}
