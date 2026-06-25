// Ядро расчёта стоимости КП. Чистая функция, повторяющая логику Расчет SEO.xlsx.

import {
  AUDIENCE_COEF,
  BASE_COST,
  COMMERCIAL_BUNDLE,
  COMPETITION_COEF,
  CURRENCY,
  DIRECTION_COEF,
  DIRECTION_COEFFICIENTS,
  DIRECTION_NAME,
  DIRECTION_ORDER,
  ERRORS_COEF,
  EXPERIENCE_COEF,
  HOUR_RATE,
  LINK_BUILDING_COEF,
  PAGES_COEF,
  REGION_COEF,
} from "./seo-config";
import { formatMonthRanges } from "./format";
import type {
  CalcResult,
  CoefficientKey,
  DirectionCalc,
  DirectionKey,
  DirectionScheduleCalc,
  MonthBreakdown,
  ProposalInput,
  ScheduleResult,
} from "./types";

/** Значение одного коэффициента для заданных входных данных. */
function coefValue(key: CoefficientKey, input: ProposalInput): number {
  switch (key) {
    case "region":
      return REGION_COEF[input.region];
    case "audience":
      return AUDIENCE_COEF[input.audience];
    case "pages":
      return PAGES_COEF[input.pages];
    case "errors":
      return ERRORS_COEF[input.errors];
    case "experience":
      return EXPERIENCE_COEF[input.experience];
    case "linkBuilding":
      return LINK_BUILDING_COEF[input.linkBuilding];
    case "competition":
      return COMPETITION_COEF[input.competition];
  }
}

/** Стоимость направления за месяц (BYN). 0 — если направление выключено. */
export function directionMonthlyPrice(
  key: DirectionKey,
  input: ProposalInput,
  included: boolean,
): number {
  if (!included) return 0;
  let price = BASE_COST * DIRECTION_COEF[key];
  for (const coef of DIRECTION_COEFFICIENTS[key]) {
    price *= coefValue(coef, input);
  }
  return Math.round(price);
}

/** Часы из стоимости — как в Excel: ROUND(цена / ставка). */
export function priceToHours(price: number): number {
  return Math.round(price / HOUR_RATE);
}

/**
 * Полный расчёт по введённым параметрам и набору включённых направлений.
 * `directions` — любой массив объектов с полями key/included (DirectionSelection подходит).
 * Итог за месяц = сумма по включённым; итог за срок = месячный × durationMonths.
 *
 * Пакетная скидка (COMMERCIAL_BUNDLE): если включено направление-триггер
 * (Коммерческое SEO), включённые GEO и SERM считаются со скидкой 30%. Часы
 * следуют из цены со скидкой (как и везде в модели: часы = round(цена / ставка)).
 */
export function calculate(
  input: ProposalInput,
  directions: { key: DirectionKey; included: boolean }[],
): CalcResult {
  const includedByKey = new Map<DirectionKey, boolean>(
    directions.map((d) => [d.key, d.included]),
  );

  const bundleActive = includedByKey.get(COMMERCIAL_BUNDLE.trigger) ?? false;

  const perDirection: DirectionCalc[] = DIRECTION_ORDER.map((key) => {
    const included = includedByKey.get(key) ?? false;
    const fullMonthlyPrice = directionMonthlyPrice(key, input, included);
    const discountRate =
      included && bundleActive && COMMERCIAL_BUNDLE.discounted.includes(key)
        ? COMMERCIAL_BUNDLE.rate
        : 0;
    const monthlyPrice =
      discountRate > 0
        ? Math.round(fullMonthlyPrice * (1 - discountRate))
        : fullMonthlyPrice;
    return {
      key,
      name: DIRECTION_NAME[key],
      included,
      fullMonthlyPrice,
      discountRate,
      monthlyPrice,
      monthlyHours: included ? priceToHours(monthlyPrice) : 0,
    };
  });

  const monthlyTotalPrice = perDirection.reduce(
    (sum, d) => sum + d.monthlyPrice,
    0,
  );
  const monthlyTotalFullPrice = perDirection.reduce(
    (sum, d) => sum + d.fullMonthlyPrice,
    0,
  );
  const monthlyTotalHours = perDirection.reduce(
    (sum, d) => sum + d.monthlyHours,
    0,
  );

  return {
    currency: CURRENCY,
    durationMonths: input.durationMonths,
    perDirection,
    monthlyTotalPrice,
    monthlyTotalHours,
    monthlyTotalFullPrice,
    monthlyDiscount: monthlyTotalFullPrice - monthlyTotalPrice,
    totalPrice: monthlyTotalPrice * input.durationMonths,
    totalHours: monthlyTotalHours * input.durationMonths,
  };
}

/**
 * Привести направление к набору активных месяцев (1-based, в пределах срока).
 * Поддерживает старый формат (`included: boolean`) для рендера ранее
 * сохранённых КП: `included === true` → все месяцы, `false`/отсутствие → пусто.
 */
export function normalizeActiveMonths(
  d: { activeMonths?: number[]; included?: boolean },
  durationMonths: number,
): number[] {
  const all = Array.from({ length: durationMonths }, (_, i) => i + 1);
  if (Array.isArray(d.activeMonths)) {
    const set = new Set(
      d.activeMonths.filter((m) => m >= 1 && m <= durationMonths),
    );
    return all.filter((m) => set.has(m));
  }
  return d.included ? all : [];
}

/**
 * Помесячный расчёт: для каждого месяца берётся срез включённых в этот месяц
 * направлений и считается через `calculate` (поэтому пакетная скидка работает
 * помесячно — в месяце, где активно Коммерческое, GEO/SERM этого месяца идут со
 * скидкой). Грандтоталы — суммы по месяцам.
 *
 * `directions` принимает как новый формат (`activeMonths`), так и старый
 * (`included`) — нормализация внутри, поэтому потребители безопасны для старых КП.
 */
export function calculateSchedule(
  input: ProposalInput,
  directions: { key: DirectionKey; activeMonths?: number[]; included?: boolean }[],
): ScheduleResult {
  const durationMonths = input.durationMonths;
  const activeByKey = new Map<DirectionKey, number[]>(
    directions.map((d) => [d.key, normalizeActiveMonths(d, durationMonths)]),
  );

  const months: MonthBreakdown[] = [];
  for (let month = 1; month <= durationMonths; month++) {
    const sel = DIRECTION_ORDER.map((key) => ({
      key,
      included: (activeByKey.get(key) ?? []).includes(month),
    }));
    const m = calculate(input, sel);
    months.push({
      month,
      perDirection: m.perDirection,
      monthlyTotalPrice: m.monthlyTotalPrice,
      monthlyTotalHours: m.monthlyTotalHours,
      monthlyTotalFullPrice: m.monthlyTotalFullPrice,
      monthlyDiscount: m.monthlyDiscount,
    });
  }

  const perDirection: DirectionScheduleCalc[] = DIRECTION_ORDER.map((key) => {
    const activeMonths = activeByKey.get(key) ?? [];
    let totalPrice = 0;
    let totalFullPrice = 0;
    let totalHours = 0;
    for (const month of activeMonths) {
      const dc = months[month - 1].perDirection.find((p) => p.key === key);
      if (!dc) continue;
      totalPrice += dc.monthlyPrice;
      totalFullPrice += dc.fullMonthlyPrice;
      totalHours += dc.monthlyHours;
    }
    return {
      key,
      name: DIRECTION_NAME[key],
      activeMonths,
      monthsLabel: formatMonthRanges(activeMonths, durationMonths),
      totalPrice,
      totalFullPrice,
      totalHours,
    };
  });

  const totalPrice = months.reduce((s, m) => s + m.monthlyTotalPrice, 0);
  const totalHours = months.reduce((s, m) => s + m.monthlyTotalHours, 0);
  const totalFullPrice = months.reduce(
    (s, m) => s + m.monthlyTotalFullPrice,
    0,
  );

  return {
    currency: CURRENCY,
    durationMonths,
    months,
    perDirection,
    totalPrice,
    totalHours,
    totalFullPrice,
    totalDiscount: totalFullPrice - totalPrice,
  };
}
