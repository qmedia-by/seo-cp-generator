// Форматирование чисел/денег/дат в русском стиле (как в референсе: «9 480,00 BYN»).

import { CURRENCY } from "./seo-config";

const moneyFmt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("ru-RU");

export function formatMoney(value: number, currency = CURRENCY): string {
  return `${moneyFmt.format(value)} ${currency}`;
}

export function formatInt(value: number): string {
  return intFmt.format(value);
}

export function formatHours(value: number): string {
  return `${intFmt.format(value)} ч`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function pluralMonths(n: number): string {
  // 3 мес / 6 мес — в нашем случае только 3 и 6, но сделаем корректно.
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} месяц`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return `${n} месяца`;
  return `${n} месяцев`;
}

/**
 * Подпись для набора активных месяцев направления:
 * - `[]` → «—» (не входит);
 * - все месяцы срока → «все N месяцев»;
 * - иначе свёрнутые диапазоны: `[1,2]` → «мес. 1–2», `[1,3,5]` → «мес. 1, 3, 5»,
 *   `[1,2,4,5,6]` → «мес. 1–2, 4–6».
 */
export function formatMonthRanges(
  months: number[],
  durationMonths: number,
): string {
  const sorted = Array.from(new Set(months))
    .filter((m) => m >= 1 && m <= durationMonths)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return "—";
  if (sorted.length === durationMonths) return `все ${pluralMonths(durationMonths)}`;

  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = cur;
    prev = cur;
  }
  return `мес. ${parts.join(", ")}`;
}
