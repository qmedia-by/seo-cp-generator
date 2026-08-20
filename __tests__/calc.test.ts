import { describe, expect, it } from "vitest";
import {
  calculate,
  calculateSchedule,
  directionMonthlyPrice,
  normalizeActiveMonths,
  priceToHours,
  quantizePrice,
} from "../lib/calc";
import {
  formatAmount,
  formatHours,
  formatMonthRanges,
  formatMonthlyAmount,
  formatMonthlyHours,
  formatMonthlyMoney,
  formatMoney,
} from "../lib/format";
import { DIRECTION_ORDER, HOUR_RATE } from "../lib/seo-config";
import type { DirectionKey, ProposalInput } from "../lib/types";

// Золотой тест: точные значения из кэша Расчет SEO.xlsx.
// Параметры примера: Вся РБ, b2b, до 1000, Единичные, Сайт продвигался, Базово, Средняя.
const goldenInput: ProposalInput = {
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

describe("calculate — золотой тест из Расчет SEO.xlsx (полные цены до скидок)", () => {
  const res = calculate(goldenInput, allIncluded);
  const byKey = Object.fromEntries(res.perDirection.map((d) => [d.key, d]));

  // Эталон Excel — это ПОЛНЫЕ цены направлений (без пакетной скидки).
  // `excel` — «сырая» цена по формуле, `price` — она же, приведённая к целому числу
  // нормо-часов (все стоимости в КП кратны ставке 75 BYN), `hours` — часы из Excel.
  const expectedFull: Record<
    DirectionKey,
    { excel: number; price: number; hours: number }
  > = {
    commercial: { excel: 1525, price: 1500, hours: 20 },
    info: { excel: 1155, price: 1125, hours: 15 },
    geo: { excel: 1307, price: 1275, hours: 17 },
    serm: { excel: 825, price: 825, hours: 11 },
    support: { excel: 540, price: 525, hours: 7 },
  };

  for (const key of DIRECTION_ORDER) {
    it(`${key}: полная цена ${expectedFull[key].price} BYN / ${expectedFull[key].hours} ч`, () => {
      expect(byKey[key].fullMonthlyPrice).toBe(expectedFull[key].price);
      // directionMonthlyPrice не знает ни о скидках, ни о кратности — это «чистый» Excel.
      expect(directionMonthlyPrice(key, goldenInput, true)).toBe(
        expectedFull[key].excel,
      );
      // Часы от кратной цены — те же, что в Excel, и сходятся с ценой без остатка.
      expect(priceToHours(expectedFull[key].excel)).toBe(expectedFull[key].hours);
      expect(byKey[key].monthlyHours * HOUR_RATE).toBe(byKey[key].monthlyPrice);
    });
  }

  it("сумма полных цен за месяц: 5250 BYN", () => {
    expect(res.monthlyTotalFullPrice).toBe(5250);
  });
});

describe("quantizePrice — все стоимости кратны ставке часа", () => {
  it("округляет до ближайшего кратного ставке", () => {
    expect(quantizePrice(1398)).toBe(1425); // 18.64 ч → 19 ч
    expect(quantizePrice(1500)).toBe(1500); // ровно 20 ч
    expect(quantizePrice(892.5)).toBe(900); // 11.9 ч → 12 ч
  });

  it("ноль остаётся нулём, включённое направление — минимум час", () => {
    expect(quantizePrice(0)).toBe(0);
    expect(quantizePrice(10)).toBe(75);
  });

  it("работает от переданной ставки", () => {
    expect(quantizePrice(1525, 150)).toBe(1500);
  });

  it("цены и часы в расчёте сходятся при любом наборе направлений", () => {
    for (const key of DIRECTION_ORDER) {
      const res = calculate(
        goldenInput,
        DIRECTION_ORDER.map((k) => ({ key: k, included: k === key })),
      );
      for (const d of res.perDirection) {
        expect(d.monthlyPrice % HOUR_RATE).toBe(0);
        expect(d.fullMonthlyPrice % HOUR_RATE).toBe(0);
        expect(d.monthlyHours * HOUR_RATE).toBe(d.monthlyPrice);
      }
      expect(res.monthlyTotalPrice % HOUR_RATE).toBe(0);
      expect(res.monthlyDiscount % HOUR_RATE).toBe(0);
    }
  });
});

describe("calculate — пакетная скидка при Коммерческом SEO", () => {
  const res = calculate(goldenInput, allIncluded);
  const byKey = Object.fromEntries(res.perDirection.map((d) => [d.key, d]));

  it("GEO и SERM получают −30% при включённом Коммерческом", () => {
    expect(byKey.geo.discountRate).toBe(0.3);
    expect(byKey.serm.discountRate).toBe(0.3);
    expect(byKey.geo.monthlyPrice).toBe(900); // 1275 × 0.7 = 892.5 → 12 ч × 75
    expect(byKey.serm.monthlyPrice).toBe(600); // 825 × 0.7 = 577.5 → 8 ч × 75
    expect(byKey.geo.monthlyHours).toBe(12); // 900 / 75
    expect(byKey.serm.monthlyHours).toBe(8); // 600 / 75
  });

  it("Коммерческое / Информационное / Техподдержка — без скидки", () => {
    expect(byKey.commercial.discountRate).toBe(0);
    expect(byKey.info.discountRate).toBe(0);
    expect(byKey.support.discountRate).toBe(0);
    expect(byKey.commercial.monthlyPrice).toBe(1500);
    expect(byKey.info.monthlyPrice).toBe(1125);
    expect(byKey.support.monthlyPrice).toBe(525);
  });

  it("итог за месяц со скидкой: 4650 BYN / 62 ч, скидка 600 BYN", () => {
    expect(res.monthlyTotalPrice).toBe(4650);
    expect(res.monthlyTotalHours).toBe(62);
    expect(res.monthlyTotalFullPrice).toBe(5250);
    expect(res.monthlyDiscount).toBe(600);
    expect(res.totalPrice).toBe(4650 * 3);
    expect(res.totalHours).toBe(62 * 3);
  });

  it("без Коммерческого SEO скидки нет — GEO/SERM по полной цене", () => {
    const noCommercial = DIRECTION_ORDER.map((key) => ({
      key,
      included: key !== "commercial",
    }));
    const r = calculate(goldenInput, noCommercial);
    const bk = Object.fromEntries(r.perDirection.map((d) => [d.key, d]));
    expect(bk.geo.discountRate).toBe(0);
    expect(bk.geo.monthlyPrice).toBe(1275);
    expect(bk.serm.monthlyPrice).toBe(825);
    expect(r.monthlyDiscount).toBe(0);
  });

  it("скидка применяется только к включённым GEO/SERM", () => {
    // Коммерческое включено, GEO выключено, SERM включён.
    const sel = DIRECTION_ORDER.map((key) => ({
      key,
      included: key === "commercial" || key === "serm",
    }));
    const r = calculate(goldenInput, sel);
    const bk = Object.fromEntries(r.perDirection.map((d) => [d.key, d]));
    expect(bk.serm.discountRate).toBe(0.3);
    expect(bk.serm.monthlyPrice).toBe(600);
    expect(bk.geo.discountRate).toBe(0); // выключен → скидки нет
    expect(bk.geo.monthlyPrice).toBe(0);
  });
});

describe("calculate — выключенные направления", () => {
  it("выключенное направление даёт 0/0 и не входит в итог", () => {
    const onlyCommercial = DIRECTION_ORDER.map((key) => ({
      key,
      included: key === "commercial",
    }));
    const res = calculate(goldenInput, onlyCommercial);
    expect(res.monthlyTotalPrice).toBe(1500);
    expect(res.monthlyTotalHours).toBe(20);
    for (const d of res.perDirection) {
      if (d.key !== "commercial") {
        expect(d.monthlyPrice).toBe(0);
        expect(d.monthlyHours).toBe(0);
      }
    }
  });

  it("при 6 мес итог удваивается относительно 3 мес", () => {
    const res6 = calculate({ ...goldenInput, durationMonths: 6 }, allIncluded);
    expect(res6.totalPrice).toBe(4650 * 6);
  });
});

describe("calculateSchedule — помесячный набор направлений", () => {
  const input6: ProposalInput = { ...goldenInput, durationMonths: 6 };
  const allActive = DIRECTION_ORDER.map((key) => ({
    key,
    activeMonths: [1, 2, 3, 4, 5, 6],
  }));

  it("равномерный набор: итог = месячный × срок (как старая логика)", () => {
    const res = calculateSchedule(input6, allActive);
    expect(res.months).toHaveLength(6);
    expect(res.totalPrice).toBe(4650 * 6);
    expect(res.totalHours).toBe(62 * 6);
    expect(res.totalFullPrice).toBe(5250 * 6);
    expect(res.totalDiscount).toBe(600 * 6);
    res.months.forEach((m) => expect(m.monthlyTotalPrice).toBe(4650));
  });

  it("SERM только в первые 2 месяца — учитывается лишь в них", () => {
    const dirs = DIRECTION_ORDER.map((key) => ({
      key,
      activeMonths: key === "serm" ? [1, 2] : [1, 2, 3, 4, 5, 6],
    }));
    const res = calculateSchedule(input6, dirs);
    const serm = res.perDirection.find((d) => d.key === "serm")!;
    expect(serm.activeMonths).toEqual([1, 2]);
    expect(serm.monthsLabel).toBe("мес. 1–2");
    // SERM со скидкой (Коммерческое активно) = 600/мес × 2 = 1200.
    expect(serm.totalPrice).toBe(600 * 2);
    // Месяцы 1–2 — полный набор (4650), месяцы 3–6 — без SERM (4650 − 600).
    expect(res.months[0].monthlyTotalPrice).toBe(4650);
    expect(res.months[2].monthlyTotalPrice).toBe(4650 - 600);
    expect(res.totalPrice).toBe(4650 * 2 + (4650 - 600) * 4);
  });

  it("скидка помесячна: GEO со скидкой только там, где активно Коммерческое", () => {
    const dirs = [
      { key: "commercial" as const, activeMonths: [1, 2] },
      { key: "geo" as const, activeMonths: [1, 2, 3, 4, 5, 6] },
    ];
    const res = calculateSchedule(input6, dirs);
    const geo = res.perDirection.find((d) => d.key === "geo")!;
    // Мес. 1–2 — скидка (900), мес. 3–6 — полная (1275).
    expect(res.months[0].perDirection.find((d) => d.key === "geo")!.monthlyPrice).toBe(900);
    expect(res.months[2].perDirection.find((d) => d.key === "geo")!.monthlyPrice).toBe(1275);
    expect(geo.totalPrice).toBe(900 * 2 + 1275 * 4);
    expect(geo.totalFullPrice).toBe(1275 * 6);
    // Помесячные величины (из них КП показывает платёж «в месяц»).
    expect(geo.pricePerMonth).toEqual([900, 900, 1275, 1275, 1275, 1275]);
    expect(geo.fullPricePerMonth).toEqual([1275, 1275, 1275, 1275, 1275, 1275]);
    expect(geo.hoursPerMonth).toEqual([12, 12, 17, 17, 17, 17]);
  });

  it("помесячные величины идут только по активным месяцам", () => {
    const dirs = DIRECTION_ORDER.map((key) => ({
      key,
      activeMonths: key === "serm" ? [1, 2] : [],
    }));
    const res = calculateSchedule(input6, dirs);
    const serm = res.perDirection.find((d) => d.key === "serm")!;
    // Коммерческого нет — SERM по полной цене.
    expect(serm.pricePerMonth).toEqual([825, 825]);
    expect(serm.hoursPerMonth).toEqual([11, 11]);
    const geo = res.perDirection.find((d) => d.key === "geo")!;
    expect(geo.pricePerMonth).toEqual([]);
    expect(geo.totalPrice).toBe(0);
  });

  it("обратная совместимость: старый included → все месяцы", () => {
    const dirs = DIRECTION_ORDER.map((key) => ({ key, included: true }));
    const res = calculateSchedule(input6, dirs);
    expect(res.totalPrice).toBe(4650 * 6);
    res.perDirection.forEach((d) =>
      expect(d.activeMonths).toEqual([1, 2, 3, 4, 5, 6]),
    );
  });
});

describe("normalizeActiveMonths", () => {
  it("из старого included", () => {
    expect(normalizeActiveMonths({ included: true }, 3)).toEqual([1, 2, 3]);
    expect(normalizeActiveMonths({ included: false }, 3)).toEqual([]);
    expect(normalizeActiveMonths({}, 3)).toEqual([]);
  });
  it("обрезает по сроку и сортирует уникальные", () => {
    expect(normalizeActiveMonths({ activeMonths: [3, 1, 7, 1] }, 6)).toEqual([
      1, 3,
    ]);
  });
});

describe("formatMonthRanges", () => {
  it("сворачивает в диапазоны", () => {
    expect(formatMonthRanges([], 6)).toBe("—");
    expect(formatMonthRanges([1, 2, 3, 4, 5, 6], 6)).toBe("все 6 месяцев");
    expect(formatMonthRanges([1, 2], 6)).toBe("мес. 1–2");
    expect(formatMonthRanges([1, 3, 5], 6)).toBe("мес. 1, 3, 5");
    expect(formatMonthRanges([1, 2, 4, 5, 6], 6)).toBe("мес. 1–2, 4–6");
  });
});

describe("помесячные форматтеры (акцент КП — платёж за месяц)", () => {
  // Ожидания строим через базовые форматтеры: в ru-RU разделитель групп —
  // неразрывный пробел, литерал в тесте с ним не совпал бы.
  it("одинаковые месяцы — одно число, разные — «от»", () => {
    expect(formatMonthlyMoney([4713, 4713, 4713])).toBe(formatMoney(4713));
    expect(formatMonthlyMoney([4713, 2134])).toBe(`от ${formatMoney(2134)}`);
    expect(formatMonthlyAmount([4713, 2134])).toBe(`от ${formatAmount(2134)}`);
    expect(formatMonthlyHours([62, 62])).toBe(formatHours(62));
    expect(formatMonthlyHours([62, 28])).toBe(`от ${formatHours(28)}`);
  });

  it("нули (месяц без работ) не занижают платёж, пустой набор — прочерк", () => {
    expect(formatMonthlyMoney([0, 4713, 4713])).toBe(formatMoney(4713));
    expect(formatMonthlyMoney([])).toBe("—");
    expect(formatMonthlyAmount([0])).toBe("—");
  });
});

describe("directionMonthlyPrice — формулы направлений различаются", () => {
  it("Техподдержка не зависит от региона", () => {
    const a = directionMonthlyPrice("support", goldenInput, true);
    const b = directionMonthlyPrice(
      "support",
      { ...goldenInput, region: "Россия" },
      true,
    );
    expect(a).toBe(b);
  });

  it("Коммерческое зависит от региона", () => {
    const a = directionMonthlyPrice("commercial", goldenInput, true);
    const b = directionMonthlyPrice(
      "commercial",
      { ...goldenInput, region: "Россия" },
      true,
    );
    expect(a).not.toBe(b);
  });
});
