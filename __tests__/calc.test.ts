import { describe, expect, it } from "vitest";
import {
  calculate,
  calculateSchedule,
  directionMonthlyPrice,
  normalizeActiveMonths,
  priceToHours,
} from "../lib/calc";
import { formatMonthRanges } from "../lib/format";
import { DIRECTION_ORDER } from "../lib/seo-config";
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
  const expectedFull: Record<DirectionKey, { price: number; hours: number }> = {
    commercial: { price: 1525, hours: 20 },
    info: { price: 1155, hours: 15 },
    geo: { price: 1307, hours: 17 },
    serm: { price: 825, hours: 11 },
    support: { price: 540, hours: 7 },
  };

  for (const key of DIRECTION_ORDER) {
    it(`${key}: полная цена ${expectedFull[key].price} BYN / ${expectedFull[key].hours} ч`, () => {
      expect(byKey[key].fullMonthlyPrice).toBe(expectedFull[key].price);
      // directionMonthlyPrice не знает о пакетных скидках — это «чистый» Excel.
      expect(directionMonthlyPrice(key, goldenInput, true)).toBe(
        expectedFull[key].price,
      );
      expect(priceToHours(expectedFull[key].price)).toBe(expectedFull[key].hours);
    });
  }

  it("сумма полных цен за месяц: 5352 BYN", () => {
    expect(res.monthlyTotalFullPrice).toBe(5352);
  });
});

describe("calculate — пакетная скидка при Коммерческом SEO", () => {
  const res = calculate(goldenInput, allIncluded);
  const byKey = Object.fromEntries(res.perDirection.map((d) => [d.key, d]));

  it("GEO и SERM получают −30% при включённом Коммерческом", () => {
    expect(byKey.geo.discountRate).toBe(0.3);
    expect(byKey.serm.discountRate).toBe(0.3);
    expect(byKey.geo.monthlyPrice).toBe(915); // round(1307 × 0.7)
    expect(byKey.serm.monthlyPrice).toBe(578); // round(825 × 0.7)
    expect(byKey.geo.monthlyHours).toBe(12); // round(915 / 75)
    expect(byKey.serm.monthlyHours).toBe(8); // round(578 / 75)
  });

  it("Коммерческое / Информационное / Техподдержка — без скидки", () => {
    expect(byKey.commercial.discountRate).toBe(0);
    expect(byKey.info.discountRate).toBe(0);
    expect(byKey.support.discountRate).toBe(0);
    expect(byKey.commercial.monthlyPrice).toBe(1525);
    expect(byKey.info.monthlyPrice).toBe(1155);
    expect(byKey.support.monthlyPrice).toBe(540);
  });

  it("итог за месяц со скидкой: 4713 BYN / 62 ч, скидка 639 BYN", () => {
    expect(res.monthlyTotalPrice).toBe(4713);
    expect(res.monthlyTotalHours).toBe(62);
    expect(res.monthlyTotalFullPrice).toBe(5352);
    expect(res.monthlyDiscount).toBe(639);
    expect(res.totalPrice).toBe(4713 * 3);
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
    expect(bk.geo.monthlyPrice).toBe(1307);
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
    expect(bk.serm.monthlyPrice).toBe(578);
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
    expect(res.monthlyTotalPrice).toBe(1525);
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
    expect(res6.totalPrice).toBe(4713 * 6);
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
    expect(res.totalPrice).toBe(4713 * 6);
    expect(res.totalHours).toBe(62 * 6);
    expect(res.totalFullPrice).toBe(5352 * 6);
    expect(res.totalDiscount).toBe(639 * 6);
    res.months.forEach((m) => expect(m.monthlyTotalPrice).toBe(4713));
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
    // SERM со скидкой (Коммерческое активно) = 578/мес × 2 = 1156.
    expect(serm.totalPrice).toBe(578 * 2);
    // Месяцы 1–2 — полный набор (4713), месяцы 3–6 — без SERM (4713 − 578).
    expect(res.months[0].monthlyTotalPrice).toBe(4713);
    expect(res.months[2].monthlyTotalPrice).toBe(4713 - 578);
    expect(res.totalPrice).toBe(4713 * 2 + (4713 - 578) * 4);
  });

  it("скидка помесячна: GEO со скидкой только там, где активно Коммерческое", () => {
    const dirs = [
      { key: "commercial" as const, activeMonths: [1, 2] },
      { key: "geo" as const, activeMonths: [1, 2, 3, 4, 5, 6] },
    ];
    const res = calculateSchedule(input6, dirs);
    const geo = res.perDirection.find((d) => d.key === "geo")!;
    // Мес. 1–2 — скидка (915), мес. 3–6 — полная (1307).
    expect(res.months[0].perDirection.find((d) => d.key === "geo")!.monthlyPrice).toBe(915);
    expect(res.months[2].perDirection.find((d) => d.key === "geo")!.monthlyPrice).toBe(1307);
    expect(geo.totalPrice).toBe(915 * 2 + 1307 * 4);
    expect(geo.totalFullPrice).toBe(1307 * 6);
  });

  it("обратная совместимость: старый included → все месяцы", () => {
    const dirs = DIRECTION_ORDER.map((key) => ({ key, included: true }));
    const res = calculateSchedule(input6, dirs);
    expect(res.totalPrice).toBe(4713 * 6);
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
