// Два листа на каждое направление SEO:
//   • описание (макеты 14–18) — показывается всегда, даже если направление
//     в предложение не входит: клиент видит весь спектр услуг;
//   • состав работ — только когда направление активно хотя бы в одном месяце.
//
// Описание берётся из `PITCH_DIRECTIONS` по ключу направления, цифры и состав
// работ — из расчёта и снимка КП.

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  formatHours,
  formatMoney,
  formatMonthlyHours,
  formatMonthlyMoney,
} from "../../format";
import type { PitchDirection } from "../../pitch";
import type { DirectionScheduleCalc, DirectionSelection } from "../../types";
import { Bullets, Kicker, NoteBox, Slide, SlideHead, rich } from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  headRow: { flexDirection: "row", alignItems: "flex-start" },
  headMain: { flex: 1, paddingRight: 12 },

  badgeOn: {
    backgroundColor: DECK.yellow,
    color: DECK.black,
    borderRadius: R.sm,
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  badgeOff: {
    backgroundColor: DECK.card,
    color: DECK.grey,
    borderRadius: R.sm,
    fontSize: 9,
    lineHeight: 1,
    paddingHorizontal: 8,
    marginTop: 6,
  },

  cols: { flexDirection: "row", gap: 18, marginTop: 4 },
  col: { flex: 1 },
  defsCol: { width: 128 },
  resultTitle: { fontSize: 10, fontWeight: 700, color: DECK.ink, lineHeight: 1.3, marginBottom: 6 },
  def: {
    borderWidth: 1.5,
    borderColor: DECK.yellow,
    borderRadius: R.md,
    padding: 8,
    marginBottom: 10,
  },
  defText: { fontSize: 9, lineHeight: 1.3 },

  // --- Лист состава работ ---
  banner: {
    flexDirection: "row",
    backgroundColor: DECK.fact,
    borderRadius: R.md,
    paddingVertical: 5,
    marginBottom: 5,
  },
  bannerCell: { flex: 1, paddingHorizontal: 12 },
  bannerDivider: { borderLeftWidth: 1, borderLeftColor: DECK.white },
  bannerLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: DECK.greenDeep,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  sumPlate: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.md,
    paddingHorizontal: 9,
  },
  sumText: { fontSize: 15, fontWeight: 700, color: DECK.black, lineHeight: 1 },
  bannerValue: { fontSize: 13, fontWeight: 700, color: DECK.ink, lineHeight: 1.1 },
  bannerSub: { fontSize: 8, color: DECK.muted, marginTop: 2 },
  strike: { textDecoration: "line-through", color: DECK.muted },

  monthDots: { flexDirection: "row", marginTop: 5 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: DECK.line,
    marginRight: 4,
  },
  dotOn: { backgroundColor: DECK.green },

  workGrid: { flexDirection: "row", flexWrap: "wrap" },
  workCell: { paddingRight: 6, paddingBottom: 4 },
  workCard: { backgroundColor: DECK.card, borderRadius: R.md, padding: 5 },
  workHead: { fontSize: 7.8, fontWeight: 700, color: DECK.ink, lineHeight: 1.2 },
  workDesc: { fontSize: 6.6, color: DECK.grey, lineHeight: 1.2, marginTop: 2 },
});

/** Плашка со сроком направления — связывает описание со сметой. */
function DirectionBadge({ calc }: { calc?: DirectionScheduleCalc }) {
  const included = (calc?.activeMonths.length ?? 0) > 0;
  return (
    <Text
      style={[
        included ? s.badgeOn : s.badgeOff,
        platePadding(9, 5),
      ]}
    >
      {included ? calc!.monthsLabel : "не входит"}
    </Text>
  );
}

/** Макеты 14–18 — что делаем по направлению и что это даёт бизнесу. */
export function DirectionAboutSlide({
  pitch,
  calc,
}: {
  pitch: PitchDirection;
  calc?: DirectionScheduleCalc;
}) {
  return (
    <Slide>
      <View style={s.headRow}>
        <View style={s.headMain}>
          <SlideHead
            title={pitch.title}
            subtitle={pitch.subtitle}
            size={pitch.titleSize ?? 27}
            subSize={pitch.subtitleSize ?? 16}
          />
        </View>
        <DirectionBadge calc={calc} />
      </View>

      <View style={s.cols}>
        <View style={s.col}>
          <Kicker style={{ fontSize: 10 }}>{pitch.doTitle}</Kicker>
          <Bullets items={pitch.does} size={9.5} gap={5} />
        </View>

        <View style={s.col}>
          {pitch.resultTitle.map((line, i) => (
            <Text
              key={i}
              style={[s.resultTitle, i < pitch.resultTitle.length - 1 ? { marginBottom: 0 } : {}]}
            >
              {rich(line)}
            </Text>
          ))}
          <Bullets items={pitch.results} size={9.5} gap={5} />
          <View style={{ height: 8 }} />
          <NoteBox size={9}>{pitch.note}</NoteBox>
        </View>

        {/* У GEO/AEO в макете есть отдельная колонка с расшифровкой терминов. */}
        {!!pitch.defs && (
          <View style={s.defsCol}>
            {pitch.defs.map((d) => (
              <View key={d.term} style={s.def}>
                <Text style={s.defText}>
                  <Text style={{ fontWeight: 700 }}>{d.term}</Text> — {clean(d.text)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Slide>
  );
}

/**
 * Пункт каталога имеет вид «Заголовок — описание»: заголовок читается жирным.
 * У произвольных работ тире может не быть — тогда весь текст идёт заголовком.
 */
function splitWork(text: string): { head: string; rest: string } {
  const i = text.indexOf(" — ");
  if (i === -1) return { head: text, rest: "" };
  return { head: text.slice(0, i), rest: text.slice(i + 3) };
}

/**
 * Лист состава работ направления.
 *
 * Крупная цифра — платёж за месяц, а не сумма за срок: «17 тыс. за 3 месяца»
 * пугает клиента (фидбэк отдела продаж). Сумма за срок остаётся обычной строкой.
 */
export function DirectionWorksSlide({
  direction,
  calc,
  durationMonths,
}: {
  direction: DirectionSelection;
  calc: DirectionScheduleCalc;
  durationMonths: number;
}) {
  const active = new Set(calc.activeMonths);
  const discounted = calc.totalFullPrice > calc.totalPrice;
  const months = Array.from({ length: durationMonths }, (_, i) => i + 1);
  // Экономию считаем по месяцам поэлементно: если направление активно и в
  // месяцы со скидкой, и без неё, разница минимумов дала бы неверную величину.
  const discountPerMonth = calc.fullPricePerMonth.map(
    (full, i) => full - calc.pricePerMonth[i],
  );
  // Полный каталог направления — 11 работ; в два столбца шесть рядов карточек
  // в 405 pt не помещаются, поэтому длинные списки раскладываем в три колонки.
  const colWidth = direction.works.length > 6 ? "33.33%" : "50%";

  return (
    <Slide>
      <SlideHead
        title={direction.name}
        subtitle={direction.goal}
        size={20}
        subSize={11}
        subGap={6}
      />

      <View style={s.banner} wrap={false}>
        <View style={s.bannerCell}>
          <Text style={s.bannerLabel}>Стоимость в месяц</Text>
          <View style={[s.sumPlate, platePadding(15, 5)]}>
            <Text style={s.sumText}>{formatMonthlyMoney(calc.pricePerMonth)}</Text>
          </View>
          {discounted && (
            <Text style={s.bannerSub}>
              без скидки{" "}
              <Text style={s.strike}>
                {formatMonthlyMoney(calc.fullPricePerMonth)}
              </Text>
              {" · экономия "}
              <Text style={{ color: DECK.greenDeep, fontWeight: 700 }}>
                {formatMonthlyMoney(discountPerMonth)}
              </Text>
            </Text>
          )}
        </View>

        <View style={[s.bannerCell, s.bannerDivider]}>
          <Text style={s.bannerLabel}>Период работ</Text>
          <Text style={s.bannerValue}>{calc.monthsLabel}</Text>
          <View style={s.monthDots}>
            {months.map((m) => (
              <View key={m} style={[s.dot, active.has(m) ? s.dotOn : {}]} />
            ))}
          </View>
          <Text style={s.bannerSub}>за срок — {formatMoney(calc.totalPrice)}</Text>
        </View>

        <View style={[s.bannerCell, s.bannerDivider]}>
          <Text style={s.bannerLabel}>Объём работ</Text>
          <Text style={s.bannerValue}>
            {formatMonthlyHours(calc.hoursPerMonth)} в месяц
          </Text>
          <Text style={s.bannerSub}>
            {direction.works.length} видов работ · {formatHours(calc.totalHours)} за срок
          </Text>
        </View>
      </View>

      <Kicker style={{ fontSize: 10, marginBottom: 3 }}>Состав работ</Kicker>
      <View style={s.workGrid}>
        {direction.works.map((w, i) => {
          const { head, rest } = splitWork(w.text);
          return (
            <View key={i} style={[s.workCell, { width: colWidth }]} wrap={false}>
              <View style={s.workCard}>
                <Text style={s.workHead}>{clean(head)}</Text>
                {rest !== "" && <Text style={s.workDesc}>{clean(rest)}</Text>}
              </View>
            </View>
          );
        })}
      </View>
    </Slide>
  );
}
