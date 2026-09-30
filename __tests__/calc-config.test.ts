import { describe, expect, it } from "vitest";
import { calculate, calculateSchedule } from "../lib/calc";
import {
  DEFAULT_CALC_CONFIG,
  cloneCalcConfig,
  findCurrency,
  mergeCalcConfig,
  resolveCurrency,
} from "../lib/calc-config";
import { calcConfigSchema } from "../lib/validation";
import { DIRECTION_ORDER } from "../lib/seo-config";
import type { ProposalInput } from "../lib/types";

// Тот же пример, что в золотом тесте: «сырые» цены по формуле — 1525/1155/1307/825/540,
// в расчёте они приводятся к кратности ставки часа — 1500/1125/1275/825/525.
const input: ProposalInput = {
  siteName: "example.by",
  region: "Вся РБ",
  durationMonths: 3,
  audience: "b2b",
  promoteType: "услуги",
  pages: "до 1000",
  experience: "Сайт продвигался",
  errors: "Единичные",
  linkBuilding: "Базово",
  competition: "Средняя",
};

const allIncluded = DIRECTION_ORDER.map((key) => ({ key, included: true }));
/** Конфиг с одной валютой BYN и заданными ставками. */
const bynRates = (baseCost: number, hourRate: number) => ({
  currencies: [{ name: "BYN", baseCost, hourRate, decimals: 2 }],
});
const priceOf = (res: ReturnType<typeof calculate>, key: string) =>
  res.perDirection.find((d) => d.key === key)!;

describe("mergeCalcConfig — чтение настроек из БД", () => {
  it("пустые/битые данные дают значения по умолчанию", () => {
    expect(mergeCalcConfig(null)).toEqual(DEFAULT_CALC_CONFIG);
    expect(mergeCalcConfig("мусор")).toEqual(DEFAULT_CALC_CONFIG);
    expect(mergeCalcConfig({ baseCost: -10, hourRate: "abc" })).toEqual(
      DEFAULT_CALC_CONFIG,
    );
    expect(mergeCalcConfig({ currencies: "мусор" })).toEqual(DEFAULT_CALC_CONFIG);
  });

  it("частичный объект добирает недостающее из дефолтов", () => {
    const cfg = mergeCalcConfig({ coef: { region: { Минск: 1.5 } } });
    expect(cfg.currencies).toEqual(DEFAULT_CALC_CONFIG.currencies);
    expect(cfg.coef.region["Минск"]).toBe(1.5);
    // Остальные варианты того же списка — как в дефолтах.
    expect(cfg.coef.region["Вся РБ"]).toBe(
      DEFAULT_CALC_CONFIG.coef.region["Вся РБ"],
    );
    expect(cfg.coef.pages).toEqual(DEFAULT_CALC_CONFIG.coef.pages);
  });

  it("числа-строки с запятой (ввод из формы) приводятся к числу", () => {
    expect(mergeCalcConfig({ coef: { audience: { b2b: "1,25" } } }).coef.audience.b2b).toBe(
      1.25,
    );
  });

  it("матрица применимости чистится от мусора и получает канонический порядок", () => {
    const cfg = mergeCalcConfig({
      directionCoefficients: { support: ["ошибка", "experience", "pages"] },
    });
    expect(cfg.directionCoefficients.support).toEqual(["pages", "experience"]);
    expect(cfg.directionCoefficients.commercial).toEqual(
      DEFAULT_CALC_CONFIG.directionCoefficients.commercial,
    );
  });

  it("скидка вне диапазона 0..1 откатывается к дефолту, ноль допустим", () => {
    expect(mergeCalcConfig({ bundle: { rate: 1.5 } }).bundle.rate).toBe(
      DEFAULT_CALC_CONFIG.bundle.rate,
    );
    expect(mergeCalcConfig({ bundle: { rate: 0 } }).bundle.rate).toBe(0);
  });

  it("cloneCalcConfig не делит вложенные объекты с исходником", () => {
    const copy = cloneCalcConfig(DEFAULT_CALC_CONFIG);
    copy.coef.region["Минск"] = 99;
    copy.directionCoefficients.commercial.push("region");
    copy.currencies[0].baseCost = 1;
    copy.currencies.push({ name: "USD", baseCost: 1, hourRate: 1, decimals: 2 });
    expect(DEFAULT_CALC_CONFIG.coef.region["Минск"]).toBe(1);
    expect(DEFAULT_CALC_CONFIG.directionCoefficients.commercial).toHaveLength(7);
    expect(DEFAULT_CALC_CONFIG.currencies).toEqual([
      { name: "BYN", baseCost: 750, hourRate: 75, decimals: 2 },
    ]);
  });
});

describe("mergeCalcConfig — валюты", () => {
  it("легаси-формат (одна пара baseCost/hourRate) читается как валюта BYN", () => {
    // Так хранятся настройки и снимки КП, сохранённые до появления валют.
    expect(mergeCalcConfig({ baseCost: 900, hourRate: 90 }).currencies).toEqual([
      { name: "BYN", baseCost: 900, hourRate: 90, decimals: 2 },
    ]);
    expect(mergeCalcConfig({ baseCost: 900 }).currencies).toEqual([
      { name: "BYN", baseCost: 900, hourRate: 75, decimals: 2 },
    ]);
  });

  it("список валют сохраняет порядок, числа-строки приводятся к числу", () => {
    const cfg = mergeCalcConfig({
      currencies: [
        { name: " USD ", baseCost: "250", hourRate: "25,5", decimals: 2 },
        { name: "руб.", baseCost: 25000, hourRate: 2500, decimals: 0 },
      ],
    });
    expect(cfg.currencies).toEqual([
      { name: "USD", baseCost: 250, hourRate: 25.5, decimals: 2 },
      { name: "руб.", baseCost: 25000, hourRate: 2500, decimals: 0 },
    ]);
  });

  it("разрядность: битая — до сотых; «целые» при дробной ставке — тоже до сотых", () => {
    const decimalsOf = (item: Record<string, unknown>) =>
      mergeCalcConfig({ currencies: [{ name: "USD", baseCost: 250, ...item }] })
        .currencies[0].decimals;
    expect(decimalsOf({ hourRate: 25 })).toBe(2);
    expect(decimalsOf({ hourRate: 25, decimals: 5 })).toBe(2);
    expect(decimalsOf({ hourRate: 25, decimals: 0 })).toBe(0);
    // 25,5 × 19 ч = 484,5 — в «целых» напечаталось бы с округлением.
    expect(decimalsOf({ hourRate: 25.5, decimals: 0 })).toBe(2);
  });

  it("битые записи и повторы выбрасываются целиком", () => {
    const cfg = mergeCalcConfig({
      currencies: [
        { name: "USD", baseCost: 250, hourRate: 25 },
        { name: "usd", baseCost: 1, hourRate: 1 }, // повтор без учёта регистра
        { name: "₽", baseCost: 20000, hourRate: 2000 }, // символы не ограничены
        { name: "ДЛИННО", baseCost: 1, hourRate: 1 }, // длиннее 5 символов
        { name: "EUR", baseCost: -1, hourRate: 25 }, // битое число — не дефолт BYN
        { name: "руб.", baseCost: 20000, hourRate: 2000 },
        "мусор",
      ],
    });
    expect(cfg.currencies.map((c) => c.name)).toEqual(["USD", "₽", "руб."]);
  });

  it("все записи битые — откат на легаси-валюту", () => {
    expect(
      mergeCalcConfig({ currencies: [{ name: "" }], baseCost: 800 }).currencies,
    ).toEqual([{ name: "BYN", baseCost: 800, hourRate: 75, decimals: 2 }]);
  });

  it("resolveCurrency: по имени, без имени — BYN, неизвестная — первая", () => {
    const cfg = mergeCalcConfig({
      currencies: [
        { name: "USD", baseCost: 250, hourRate: 25 },
        { name: "BYN", baseCost: 750, hourRate: 75 },
      ],
    });
    expect(resolveCurrency(cfg, "usd").name).toBe("USD");
    expect(resolveCurrency(cfg, "BYN").name).toBe("BYN");
    // КП до выбора валюты считались в BYN, даже если она теперь не первая.
    expect(resolveCurrency(cfg, undefined).name).toBe("BYN");
    expect(resolveCurrency(cfg, "EUR").name).toBe("USD");
    expect(findCurrency(cfg, "EUR")).toBeUndefined();
  });
});

describe("calcConfigSchema — валюты", () => {
  const valid = {
    ...DEFAULT_CALC_CONFIG,
    currencies: [
      { name: "BYN", baseCost: 750, hourRate: 75, decimals: 2 },
      { name: "USD", baseCost: 250, hourRate: 25, decimals: 0 },
    ],
  };

  it("принимает корректный список", () => {
    expect(calcConfigSchema.safeParse(valid).success).toBe(true);
  });

  it("отклоняет пустой список, повтор имени и длинное имя; символы не ограничены", () => {
    const withCurrencies = (currencies: unknown) =>
      calcConfigSchema.safeParse({ ...valid, currencies }).success;
    const usd = { name: "USD", baseCost: 250, hourRate: 25, decimals: 2 };
    expect(withCurrencies([])).toBe(false);
    expect(withCurrencies([usd, { ...usd, name: "usd" }])).toBe(false);
    expect(withCurrencies([{ ...usd, name: "ДЛИННО" }])).toBe(false);
    expect(withCurrencies([{ ...usd, name: "  " }])).toBe(false);
    expect(withCurrencies([{ ...usd, name: "₽" }])).toBe(true);
    expect(withCurrencies([{ ...usd, name: 'р"б' }])).toBe(true);
  });

  it("отклоняет дробную ставку при целых суммах и чужую разрядность", () => {
    const withCurrency = (c: Record<string, unknown>) =>
      calcConfigSchema.safeParse({
        ...valid,
        currencies: [{ name: "USD", baseCost: 250, hourRate: 25, decimals: 2, ...c }],
      }).success;
    expect(withCurrency({ hourRate: 22.5, decimals: 0 })).toBe(false);
    expect(withCurrency({ hourRate: 22.5, decimals: 2 })).toBe(true);
    expect(withCurrency({ hourRate: 22.555, decimals: 2 })).toBe(false);
    expect(withCurrency({ decimals: 1 })).toBe(false);
  });
});

describe("calculate — расчёт по настроенному конфигу", () => {
  it("без конфига считает по значениям по умолчанию", () => {
    expect(calculate(input, allIncluded)).toEqual(
      calculate(input, allIncluded, DEFAULT_CALC_CONFIG),
    );
  });

  it("базовая стоимость масштабирует цены", () => {
    const cfg = mergeCalcConfig(bynRates(1500, 75));
    // 1500 × 1.4 × 1.1 × 1.0 × 1.2 × 1.1 = 3049.2 (округление в конце, не ×2 от 1525),
    // дальше — к кратности ставки: 3049.2 / 75 = 40.66 → 41 ч × 75 = 3075.
    expect(priceOf(calculate(input, allIncluded, cfg), "commercial").fullMonthlyPrice).toBe(3075);
  });

  it("стоимость часа задаёт и объём часов, и шаг цены", () => {
    const cfg = mergeCalcConfig(bynRates(750, 150));
    const d = priceOf(calculate(input, allIncluded, cfg), "commercial");
    expect(d.monthlyHours).toBe(10); // round(1525 / 150)
    expect(d.fullMonthlyPrice).toBe(1500); // 10 ч × 150 — цена кратна ставке
  });

  it("снятый коэффициент выпадает из формулы направления", () => {
    const cfg = mergeCalcConfig({
      directionCoefficients: {
        ...DEFAULT_CALC_CONFIG.directionCoefficients,
        commercial: ["region", "audience", "pages", "errors", "experience", "linkBuilding"],
      },
    });
    // Без множителя конкуренции (1.1): 750 × 1.4 × 1.1 × 1.2 = 1386 → 18 ч × 75 = 1350.
    expect(priceOf(calculate(input, allIncluded, cfg), "commercial").fullMonthlyPrice).toBe(1350);
  });

  it("правка коэффициента параметра меняет цену", () => {
    const cfg = mergeCalcConfig({ coef: { competition: { Средняя: 1.0 } } });
    expect(priceOf(calculate(input, allIncluded, cfg), "commercial").monthlyPrice).toBe(1350);
  });

  it("пакетная скидка берёт процент и состав из настроек", () => {
    const cfg = mergeCalcConfig({
      bundle: { trigger: "commercial", discounted: ["geo"], rate: 0.5 },
    });
    const res = calculate(input, allIncluded, cfg);
    expect(priceOf(res, "geo").monthlyPrice).toBe(675); // 1275 × 0.5 = 637.5 → 9 ч × 75
    expect(priceOf(res, "serm").monthlyPrice).toBe(825); // больше не в списке скидок
  });

  it("нулевая скидка отключает пакет", () => {
    const cfg = mergeCalcConfig({ bundle: { rate: 0 } });
    const res = calculate(input, allIncluded, cfg);
    expect(res.monthlyDiscount).toBe(0);
    expect(res.monthlyTotalPrice).toBe(5250); // сумма полных цен из золотого теста
  });
});

describe("calculate — валюта КП", () => {
  const cfg = mergeCalcConfig({
    currencies: [
      { name: "BYN", baseCost: 750, hourRate: 75, decimals: 2 },
      { name: "USD", baseCost: 250, hourRate: 20, decimals: 0 },
    ],
  });

  it("без валюты в input — BYN и дефолтные ставки (как в золотом тесте)", () => {
    const res = calculate(input, allIncluded, cfg);
    expect(res.currency).toBe("BYN");
    expect(res.decimals).toBe(2);
    expect(res.monthlyTotalPrice).toBe(4650);
  });

  it("выбранная валюта даёт свою базу, свой шаг цены и свою подпись", () => {
    const res = calculate({ ...input, currency: "USD" }, allIncluded, cfg);
    expect(res.currency).toBe("USD");
    expect(res.decimals).toBe(0);
    const commercial = priceOf(res, "commercial");
    // 250 × 1.4 × 1.1 × 1.0 × 1.2 × 1.1 = 508.2 → 25 ч × 20 = 500.
    expect(commercial.fullMonthlyPrice).toBe(500);
    expect(commercial.monthlyHours).toBe(25);
    for (const d of res.perDirection) expect(d.monthlyPrice % 20).toBe(0);
  });

  it("calculateSchedule несёт валюту в итог", () => {
    const dirs = DIRECTION_ORDER.map((key) => ({ key, activeMonths: [1, 2, 3] }));
    expect(calculateSchedule({ ...input, currency: "USD" }, dirs, cfg).currency).toBe(
      "USD",
    );
  });
});

describe("calculateSchedule — конфиг доходит до помесячного расчёта", () => {
  it("итог за срок считается по переданным настройкам", () => {
    const cfg = mergeCalcConfig({ bundle: { rate: 0 } });
    const dirs = DIRECTION_ORDER.map((key) => ({ key, activeMonths: [1, 2, 3] }));
    const res = calculateSchedule(input, dirs, cfg);
    expect(res.totalPrice).toBe(5250 * 3);
    expect(res.totalDiscount).toBe(0);
  });
});
