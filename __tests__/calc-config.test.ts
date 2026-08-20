import { describe, expect, it } from "vitest";
import { calculate, calculateSchedule } from "../lib/calc";
import {
  DEFAULT_CALC_CONFIG,
  cloneCalcConfig,
  mergeCalcConfig,
} from "../lib/calc-config";
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
const priceOf = (res: ReturnType<typeof calculate>, key: string) =>
  res.perDirection.find((d) => d.key === key)!;

describe("mergeCalcConfig — чтение настроек из БД", () => {
  it("пустые/битые данные дают значения по умолчанию", () => {
    expect(mergeCalcConfig(null)).toEqual(DEFAULT_CALC_CONFIG);
    expect(mergeCalcConfig("мусор")).toEqual(DEFAULT_CALC_CONFIG);
    expect(mergeCalcConfig({ baseCost: -10, hourRate: "abc" })).toEqual(
      DEFAULT_CALC_CONFIG,
    );
  });

  it("частичный объект добирает недостающее из дефолтов", () => {
    const cfg = mergeCalcConfig({ baseCost: 900, coef: { region: { Минск: 1.5 } } });
    expect(cfg.baseCost).toBe(900);
    expect(cfg.hourRate).toBe(DEFAULT_CALC_CONFIG.hourRate);
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
    expect(DEFAULT_CALC_CONFIG.coef.region["Минск"]).toBe(1);
    expect(DEFAULT_CALC_CONFIG.directionCoefficients.commercial).toHaveLength(7);
  });
});

describe("calculate — расчёт по настроенному конфигу", () => {
  it("без конфига считает по значениям по умолчанию", () => {
    expect(calculate(input, allIncluded)).toEqual(
      calculate(input, allIncluded, DEFAULT_CALC_CONFIG),
    );
  });

  it("базовая стоимость масштабирует цены", () => {
    const cfg = mergeCalcConfig({ baseCost: 1500 });
    // 1500 × 1.4 × 1.1 × 1.0 × 1.2 × 1.1 = 3049.2 (округление в конце, не ×2 от 1525),
    // дальше — к кратности ставки: 3049.2 / 75 = 40.66 → 41 ч × 75 = 3075.
    expect(priceOf(calculate(input, allIncluded, cfg), "commercial").fullMonthlyPrice).toBe(3075);
  });

  it("стоимость часа задаёт и объём часов, и шаг цены", () => {
    const cfg = mergeCalcConfig({ hourRate: 150 });
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

describe("calculateSchedule — конфиг доходит до помесячного расчёта", () => {
  it("итог за срок считается по переданным настройкам", () => {
    const cfg = mergeCalcConfig({ bundle: { rate: 0 } });
    const dirs = DIRECTION_ORDER.map((key) => ({ key, activeMonths: [1, 2, 3] }));
    const res = calculateSchedule(input, dirs, cfg);
    expect(res.totalPrice).toBe(5250 * 3);
    expect(res.totalDiscount).toBe(0);
  });
});
