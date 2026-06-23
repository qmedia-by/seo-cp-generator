import { describe, expect, it } from "vitest";
import { calculate, directionMonthlyPrice } from "../lib/calc";
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

describe("calculate — золотой тест из Расчет SEO.xlsx", () => {
  const res = calculate(goldenInput, allIncluded);
  const byKey = Object.fromEntries(res.perDirection.map((d) => [d.key, d]));

  const expected: Record<DirectionKey, { price: number; hours: number }> = {
    commercial: { price: 1525, hours: 20 },
    info: { price: 1155, hours: 15 },
    geo: { price: 1307, hours: 17 },
    serm: { price: 825, hours: 11 },
    support: { price: 540, hours: 7 },
  };

  for (const key of DIRECTION_ORDER) {
    it(`${key}: ${expected[key].price} BYN / ${expected[key].hours} ч`, () => {
      expect(byKey[key].monthlyPrice).toBe(expected[key].price);
      expect(byKey[key].monthlyHours).toBe(expected[key].hours);
    });
  }

  it("итог за месяц: 5352 BYN / 70 ч", () => {
    expect(res.monthlyTotalPrice).toBe(5352);
    expect(res.monthlyTotalHours).toBe(70);
  });

  it("итог за срок (3 мес) = месячный × 3", () => {
    expect(res.totalPrice).toBe(5352 * 3);
    expect(res.totalHours).toBe(70 * 3);
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
    expect(res6.totalPrice).toBe(5352 * 6);
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
