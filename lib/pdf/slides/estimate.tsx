// Смета: параметры проекта, платёж в месяц и матрица «направления × месяцы».
//
// Макета у этого листа нет — он переоформлен под общую стилистику колоды:
// чёрный заголовок с жёлтой подписью, зелёная шапка таблицы, жёлтая плашка на
// главной цифре.
//
// 🛑 Крупная цифра — платёж за ОДИН месяц, а не сумма за срок (фидбэк отдела
// продаж: «17 тыс. за 3 месяца — дорого и страшно, дробить»). Сумма за срок
// остаётся, но обычной строкой.

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  formatAmount,
  formatInt,
  formatMonthlyAmount,
  formatMonthlyHours,
  formatMonthlyMoney,
  formatMoney,
  pluralMonths,
} from "../../format";
import type { ProposalInput, ScheduleResult } from "../../types";
import { Slide, SlideHead } from "../primitives";
import { DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  cols: { flexDirection: "row", gap: 18, marginBottom: 4 },
  colLeft: { width: "54%" },
  colRight: { flex: 1 },

  sectionTitle: { fontSize: 10, fontWeight: 700, color: DECK.ink, marginBottom: 4, lineHeight: 1.2 },

  paramsGrid: { flexDirection: "row", flexWrap: "wrap" },
  paramBox: { width: "33.33%", paddingBottom: 5, paddingRight: 10 },
  paramLabel: { fontSize: 6.5, color: DECK.grey, textTransform: "uppercase", lineHeight: 1.2 },
  paramValue: { fontSize: 9.5, fontWeight: 700, color: DECK.ink, lineHeight: 1.2 },

  costCard: { backgroundColor: DECK.fact, borderRadius: R.md, padding: 9 },
  costLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: DECK.greenDeep,
    textTransform: "uppercase",
    marginBottom: 5,
    lineHeight: 1.2,
  },
  costPlate: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.md,
    paddingHorizontal: 11,
    marginBottom: 6,
  },
  costPlateText: { fontSize: 19, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  costLine: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  costLineLabel: { fontSize: 8, color: DECK.ink, lineHeight: 1.25 },
  costLineValue: { fontSize: 8, fontWeight: 700, color: DECK.ink, lineHeight: 1.25 },
  strike: { textDecoration: "line-through", color: DECK.muted, fontWeight: 400 },
  divider: { height: 1, backgroundColor: DECK.white, marginVertical: 5 },
  /** Итоги карточки — в строку: три стопки экономят ~25 pt высоты. */
  costStats: { flexDirection: "row" },
  costStat: { flex: 1 },
  costStatLabel: { fontSize: 7, color: DECK.greenDeep, lineHeight: 1.2 },
  costStatValue: { fontSize: 9.5, fontWeight: 700, color: DECK.ink, lineHeight: 1.2 },

  tHead: {
    flexDirection: "row",
    backgroundColor: DECK.green,
    borderRadius: R.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  tHeadCell: { fontSize: 8, fontWeight: 700, color: DECK.white, lineHeight: 1 },
  tRow: {
    flexDirection: "row",
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: DECK.cardLine,
    alignItems: "center",
  },
  tCell: { fontSize: 8.5, color: DECK.ink, lineHeight: 1.2 },
  tTotal: {
    flexDirection: "row",
    backgroundColor: DECK.fact,
    borderRadius: R.sm,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginTop: 3,
    alignItems: "center",
  },
  tTotalCell: { fontSize: 9, fontWeight: 700, color: DECK.ink, lineHeight: 1.2 },
  right: { textAlign: "right" },
  center: { textAlign: "center" },
  muted: { color: DECK.grey },
  dotCell: { alignItems: "center" },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DECK.line },
  dotOn: { backgroundColor: DECK.green },
});

export function EstimateSlide({
  input,
  calc,
}: {
  input: ProposalInput;
  calc: ScheduleResult;
}) {
  const term = pluralMonths(calc.durationMonths);
  const monthNums = calc.months.map((m) => m.month);
  const nameW = "30%";
  const perMonthW = "16%";
  const termW = "16%";
  const monthW = `${38 / calc.durationMonths}%`;

  // Помесячные величины проекта. Считаем по месяцам, где есть работы: месяц без
  // единого активного направления не должен занижать «платёж в месяц» до нуля.
  const paid = calc.months.filter((m) => m.monthlyTotalPrice > 0);
  const monthlyPrices = paid.map((m) => m.monthlyTotalPrice);
  const monthlyFullPrices = paid.map((m) => m.monthlyTotalFullPrice);
  const monthlyDiscounts = paid.map((m) => m.monthlyDiscount);
  const monthlyHours = paid.map((m) => m.monthlyTotalHours);
  // Если набор направлений одинаков во все месяцы, «без скидки» и «экономию»
  // можно дать помесячно. Когда месяцы разные, минимумы по строкам пришли бы из
  // разных месяцев и не сходились бы между собой — тогда считаем за срок.
  const sameEveryMonth =
    new Set(monthlyPrices).size <= 1 && new Set(monthlyFullPrices).size <= 1;

  const params: [string, string][] = [
    ["Сайт", input.siteName],
    ["Регион", input.region],
    ["Срок продвижения", `${input.durationMonths} мес`],
    ["Для кого", input.audience],
    ["Что продвигаем", input.promoteType],
    ["Кол-во страниц", input.pages],
    ["Опыт SEO", input.experience],
    ["Наличие ошибок", input.errors],
    ["Ссылочное", input.linkBuilding],
    ["Конкуренция", input.competition],
  ];

  return (
    <Slide>
      <SlideHead
        title="Смета"
        subtitle="стоимость и состав работ по месяцам"
        size={22}
        subSize={12}
        subGap={7}
      />

      <View style={s.cols}>
        <View style={s.colLeft}>
          <Text style={s.sectionTitle}>Параметры проекта</Text>
          <View style={s.paramsGrid}>
            {params.map(([k, v]) => (
              <View key={k} style={s.paramBox}>
                <Text style={s.paramLabel}>{k}</Text>
                <Text style={s.paramValue}>{v}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.colRight}>
          <Text style={s.sectionTitle}>Стоимость</Text>
          <View style={s.costCard}>
            <Text style={s.costLabel}>Платёж в месяц</Text>
            <View style={[s.costPlate, platePadding(19, 6)]}>
              <Text style={s.costPlateText}>{formatMonthlyMoney(monthlyPrices)}</Text>
            </View>
            {calc.totalDiscount > 0 && (
              <>
                {sameEveryMonth && (
                  <View style={s.costLine}>
                    <Text style={s.costLineLabel}>Без скидки в месяц</Text>
                    <Text style={[s.costLineValue, s.strike]}>
                      {formatMoney(monthlyFullPrices[0])}
                    </Text>
                  </View>
                )}
                <View style={s.costLine}>
                  <Text style={s.costLineLabel}>
                    {sameEveryMonth ? "Экономия в месяц" : `Экономия за ${term}`}{" "}
                    (пакетная скидка)
                  </Text>
                  <Text style={[s.costLineValue, { color: DECK.greenDeep }]}>
                    {formatMoney(
                      sameEveryMonth ? monthlyDiscounts[0] : calc.totalDiscount,
                    )}
                  </Text>
                </View>
              </>
            )}
            <View style={s.divider} />
            <View style={s.costStats}>
              <View style={s.costStat}>
                <Text style={s.costStatLabel}>Часов в месяц</Text>
                <Text style={s.costStatValue}>
                  {formatMonthlyHours(monthlyHours)}
                </Text>
              </View>
              <View style={s.costStat}>
                <Text style={s.costStatLabel}>Срок</Text>
                <Text style={s.costStatValue}>{term}</Text>
              </View>
              <View style={s.costStat}>
                <Text style={s.costStatLabel}>Итого за {term}</Text>
                <Text style={s.costStatValue}>{formatMoney(calc.totalPrice)}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Text style={s.sectionTitle}>Состав по месяцам</Text>
      <View style={s.tHead}>
        <Text style={[s.tHeadCell, { width: nameW }]}>Направление</Text>
        <Text style={[s.tHeadCell, s.right, { width: perMonthW }]}>
          В месяц, {calc.currency}
        </Text>
        {monthNums.map((m) => (
          <Text key={m} style={[s.tHeadCell, s.center, { width: monthW }]}>
            {m}
          </Text>
        ))}
        <Text style={[s.tHeadCell, s.right, { width: termW }]}>
          За срок, {calc.currency}
        </Text>
      </View>

      {calc.perDirection.map((d) => {
        const active = new Set(d.activeMonths);
        const included = d.activeMonths.length > 0;
        const discounted = d.totalFullPrice > d.totalPrice;
        return (
          <View key={d.key} style={s.tRow} wrap={false}>
            <Text style={[s.tCell, { width: nameW }, included ? {} : s.muted]}>
              {d.name}
            </Text>
            <Text
              style={[
                s.tCell,
                s.right,
                { width: perMonthW },
                included ? {} : s.muted,
                included && discounted ? { color: DECK.greenDeep } : {},
              ]}
            >
              {included ? formatMonthlyAmount(d.pricePerMonth) : "—"}
            </Text>
            {monthNums.map((m) => (
              <View key={m} style={[s.dotCell, { width: monthW }]}>
                <View style={[s.dot, active.has(m) ? s.dotOn : {}]} />
              </View>
            ))}
            <Text
              style={[
                s.tCell,
                s.right,
                { width: termW },
                included ? s.muted : s.muted,
              ]}
            >
              {included ? formatAmount(d.totalPrice) : "—"}
            </Text>
          </View>
        );
      })}

      <View style={s.tTotal} wrap={false}>
        <Text style={[s.tTotalCell, { width: nameW }]}>Итого, {calc.currency}</Text>
        <Text style={[s.tTotalCell, s.right, { width: perMonthW }]}>
          {formatMonthlyAmount(monthlyPrices)}
        </Text>
        {calc.months.map((m) => (
          <Text key={m.month} style={[s.tTotalCell, s.center, { width: monthW }]}>
            {formatInt(Math.round(m.monthlyTotalPrice))}
          </Text>
        ))}
        <Text style={[s.tTotalCell, s.right, { width: termW }]}>
          {formatAmount(calc.totalPrice)}
        </Text>
      </View>
    </Slide>
  );
}
