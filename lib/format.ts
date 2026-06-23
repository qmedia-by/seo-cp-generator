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
