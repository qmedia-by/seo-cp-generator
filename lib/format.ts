// Форматирование чисел/денег/дат в русском стиле (как в референсе: «9 480,00 BYN»).

import { CURRENCY } from "./seo-config";

const moneyFmt = new Intl.NumberFormat("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const intFmt = new Intl.NumberFormat("ru-RU");

export function formatMoney(value: number, currency = CURRENCY): string {
  return `${formatAmount(value)} ${currency}`;
}

/** Сумма без валюты — для таблиц, где валюта вынесена в шапку колонки. */
export function formatAmount(value: number): string {
  return moneyFmt.format(value);
}

export function formatInt(value: number): string {
  return intFmt.format(value);
}

export function formatHours(value: number): string {
  return `${intFmt.format(value)} ч`;
}

/**
 * Помесячная величина для КП: суммы за срок пугают клиента, поэтому в PDF
 * акцент на платеже за один месяц. Набор направлений (и пакетная скидка) может
 * различаться по месяцам — тогда показываем минимальный платёж с «от», детали
 * клиент видит в таблице «Состав по месяцам».
 *
 * `values` — значения по активным месяцам; нули (месяц без работ) отбрасываем.
 */
/** Приставка «платёж различается по месяцам» — одна на форматирование и разбор. */
const FROM_PREFIX = "от ";

function formatPerMonth(values: number[], fmt: (v: number) => string): string {
  const paid = values.filter((v) => v > 0);
  if (paid.length === 0) return "—";
  const min = Math.min(...paid);
  const max = Math.max(...paid);
  return min === max ? fmt(min) : `${FROM_PREFIX}${fmt(min)}`;
}

/** «5 952,00 BYN» / «от 4 100,00 BYN» — платёж за один месяц. */
export function formatMonthlyMoney(values: number[], currency = CURRENCY): string {
  return formatPerMonth(values, (v) => formatMoney(v, currency));
}

/** То же без валюты — для колонок таблицы. */
export function formatMonthlyAmount(values: number[]): string {
  return formatPerMonth(values, formatAmount);
}

/** «62 ч» / «от 45 ч» — объём работ за один месяц. */
export function formatMonthlyHours(values: number[]): string {
  return formatPerMonth(values, formatHours);
}

/**
 * Разбор помесячной величины на приставку «от» и само число. Нужен PDF: «от» —
 * уточнение («в разные месяцы по-разному»), а не часть суммы, и на плашке идёт
 * мельче цифры (см. `SumText` в lib/pdf/primitives.tsx).
 */
export function splitFromPrefix(text: string): { from: boolean; value: string } {
  return text.startsWith(FROM_PREFIX)
    ? { from: true, value: text.slice(FROM_PREFIX.length) }
    : { from: false, value: text };
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
