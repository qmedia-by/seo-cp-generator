// Ядро расчёта стоимости КП. Чистая функция, повторяющая логику Расчет SEO.xlsx.
//
// Ставки и коэффициенты приходят параметром `config` (по умолчанию —
// `DEFAULT_CALC_CONFIG`, т.е. значения из Excel). Актуальный конфиг администратор
// правит в «Настройках»; сохранённое КП хранит его снимок — см. lib/calc-config.ts.

import { DEFAULT_CALC_CONFIG, type CalcConfig } from "./calc-config";
import { CURRENCY, DIRECTION_NAME, DIRECTION_ORDER } from "./seo-config";
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
function coefValue(
  key: CoefficientKey,
  input: ProposalInput,
  config: CalcConfig,
): number {
  // Имена коэффициентов совпадают с именами полей ProposalInput (region → input.region),
  // поэтому таблица и значение берутся по одному и тому же ключу.
  const table = config.coef[key] as Record<string, number>;
  return table?.[input[key]] ?? 1;
}

/** Стоимость направления за месяц (BYN). 0 — если направление выключено. */
export function directionMonthlyPrice(
  key: DirectionKey,
  input: ProposalInput,
  included: boolean,
  config: CalcConfig = DEFAULT_CALC_CONFIG,
): number {
  if (!included) return 0;
  let price = config.baseCost * config.directionCoef[key];
  for (const coef of config.directionCoefficients[key]) {
    price *= coefValue(coef, input, config);
  }
  return Math.round(price);
}

/** Часы из стоимости — как в Excel: ROUND(цена / ставка). */
export function priceToHours(
  price: number,
  hourRate: number = DEFAULT_CALC_CONFIG.hourRate,
): number {
  return Math.round(price / hourRate);
}

/**
 * Полный расчёт по введённым параметрам и набору включённых направлений.
 * `directions` — любой массив объектов с полями key/included (DirectionSelection подходит).
 * Итог за месяц = сумма по включённым; итог за срок = месячный × durationMonths.
 *
 * Пакетная скидка (`config.bundle`): если включено направление-триггер
 * (по умолчанию Коммерческое SEO), включённые GEO и SERM считаются со скидкой 30%.
 * Часы следуют из цены со скидкой (как и везде в модели: часы = round(цена / ставка)).
 */
export function calculate(
  input: ProposalInput,
  directions: { key: DirectionKey; included: boolean }[],
  config: CalcConfig = DEFAULT_CALC_CONFIG,
): CalcResult {
  const includedByKey = new Map<DirectionKey, boolean>(
    directions.map((d) => [d.key, d.included]),
  );

  const bundleActive = includedByKey.get(config.bundle.trigger) ?? false;

  const perDirection: DirectionCalc[] = DIRECTION_ORDER.map((key) => {
    const included = includedByKey.get(key) ?? false;
    const fullMonthlyPrice = directionMonthlyPrice(key, input, included, config);
    const discountRate =
      included && bundleActive && config.bundle.discounted.includes(key)
        ? config.bundle.rate
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
      monthlyHours: included ? priceToHours(monthlyPrice, config.hourRate) : 0,
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
  config: CalcConfig = DEFAULT_CALC_CONFIG,
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
    const m = calculate(input, sel, config);
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
    const pricePerMonth: number[] = [];
    const fullPricePerMonth: number[] = [];
    const hoursPerMonth: number[] = [];
    for (const month of activeMonths) {
      const dc = months[month - 1].perDirection.find((p) => p.key === key);
      if (!dc) continue;
      pricePerMonth.push(dc.monthlyPrice);
      fullPricePerMonth.push(dc.fullMonthlyPrice);
      hoursPerMonth.push(dc.monthlyHours);
    }
    const sum = (values: number[]) => values.reduce((s, v) => s + v, 0);
    return {
      key,
      name: DIRECTION_NAME[key],
      activeMonths,
      monthsLabel: formatMonthRanges(activeMonths, durationMonths),
      pricePerMonth,
      fullPricePerMonth,
      hoursPerMonth,
      totalPrice: sum(pricePerMonth),
      totalFullPrice: sum(fullPricePerMonth),
      totalHours: sum(hoursPerMonth),
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
