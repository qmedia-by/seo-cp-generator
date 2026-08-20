// Вводные слайды КП (макеты 9–13): что клиент получает, что происходит на рынке,
// почему «SEO по ключам» больше не работает, экосистема из 5 направлений и путь
// клиента. Контент — `lib/pitch.ts`, ничего от расчёта здесь не зависит.

import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import {
  PITCH_COMPLEX,
  PITCH_ECOSYSTEM,
  PITCH_JOURNEY,
  PITCH_NOW,
  PITCH_OLD_SEO,
} from "../../pitch";
import { ICON, JOURNEY_FUNNEL } from "../assets";
import { Bullets, Kicker, Overlay, Rich, Slide, SlideHead, rich } from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  // Слайд «Здесь и сейчас»
  iconGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  iconCell: { width: "50%", flexDirection: "row", paddingRight: 24, paddingBottom: 18 },
  icon: { width: 46, height: 46, marginRight: 16 },
  iconText: { flex: 1, fontSize: 12.5, lineHeight: 1.35 },

  // Слайд «SEO на рост заявок»
  lead: { fontSize: 12, marginBottom: 16, color: DECK.ink },
  factRow: { flexDirection: "row", gap: 10 },
  fact: {
    flex: 1,
    backgroundColor: DECK.fact,
    borderRadius: R.md,
    paddingVertical: 20,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  factValue: {
    fontSize: 29,
    fontWeight: 700,
    color: DECK.black,
    lineHeight: 1,
    marginBottom: 13,
  },
  factText: {
    fontSize: 10.5,
    fontStyle: "italic",
    color: DECK.caption,
    textAlign: "center",
    lineHeight: 1.35,
  },
  yellowStrip: {
    backgroundColor: DECK.yellow,
    borderRadius: R.md,
    paddingHorizontal: 14,
    marginTop: 24,
  },
  yellowStripText: { fontSize: 12.5, fontWeight: 700, color: DECK.black, lineHeight: 1 },

  // Слайд «по старинке»
  leadBox: {
    backgroundColor: DECK.note,
    borderRadius: R.md,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 20,
  },
  leadBoxText: { fontSize: 11.5, lineHeight: 1.4 },
  cols: { flexDirection: "row", gap: 22 },
  col: { flex: 1 },
  // «!» вместо маркера списка: та же сетка, что у `Bullets`, и тот же кегль,
  // что у текста, — иначе строка таблицы съезжает (react-pdf игнорирует
  // alignItems, а разный кегль даёт разную высоту строчного бокса).
  answerRow: { flexDirection: "row", marginTop: 6 },
  bangCell: { width: 7, marginRight: 8, alignItems: "center" },
  bang: { fontSize: 12, fontWeight: 700, color: DECK.yellow },
  answerText: { flex: 1, fontSize: 12, fontWeight: 700 },

  // Слайд «экосистема»
  cardRow: { flexDirection: "row", gap: 12 },
  cardRowGap: { marginBottom: 14 },
  card: {
    flex: 1,
    borderRadius: R.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: DECK.cardLine,
  },
  cardHead: { backgroundColor: DECK.cardLine, paddingHorizontal: 11 },
  cardHeadText: { fontWeight: 700, color: DECK.black, lineHeight: 1 },
  cardBody: {
    backgroundColor: DECK.card,
    paddingVertical: 12,
    paddingHorizontal: 11,
    flexGrow: 1,
    justifyContent: "center",
  },
  cardText: { fontSize: 10.5, textAlign: "center", lineHeight: 1.4 },
  /**
   * Распорки нижнего ряда. Фиксированные, а не `flex: 1`: две карточки должны
   * быть заметно шире трёх верхних (так в макете) — иначе в шапку не влезает
   * «5. Техническая SEO-поддержка» и она рвётся на две строки.
   */
  cardSpacer: { width: 55 },

  // Слайд «путь клиента»
  funnel: { position: "absolute", left: 164, top: 87, width: 503, height: 302 },
  journeyCol: { width: 178, marginTop: 20 },
  journeyClosing: {
    marginTop: 20,
    width: 185,
    fontSize: 11,
    fontWeight: 700,
    lineHeight: 1.35,
  },
});

/** Макет 9 — «Здесь и сейчас»: что клиент получает от работы с Qmedia. */
export function NowSlide() {
  return (
    <Slide>
      <SlideHead
        title={PITCH_NOW.title}
        subtitle={PITCH_NOW.subtitle}
        size={44}
        subSize={19}
      />
      <Kicker style={{ fontSize: 15, marginTop: 10, marginBottom: 0 }}>
        {PITCH_NOW.kicker}
      </Kicker>
      <View style={s.iconGrid}>
        {PITCH_NOW.items.map((it) => (
          <View key={it.text} style={s.iconCell}>
            <Image src={ICON[it.icon as keyof typeof ICON]} style={s.icon} />
            <Text style={s.iconText}>{rich(it.text)}</Text>
          </View>
        ))}
      </View>
    </Slide>
  );
}

/** Макет 10 — SEO работает на заявки, а не на позиции. */
export function ComplexSlide() {
  return (
    <Slide>
      <SlideHead title={PITCH_COMPLEX.title} size={27} />
      <Text style={s.lead}>{clean(PITCH_COMPLEX.lead)}</Text>
      <Kicker style={{ fontSize: 12, marginBottom: 10 }}>{PITCH_COMPLEX.kicker}</Kicker>
      <View style={s.factRow}>
        {PITCH_COMPLEX.market.map((f) => (
          <View key={f.value} style={s.fact}>
            <Text style={s.factValue}>{f.value}</Text>
            <Text style={s.factText}>{clean(f.text)}</Text>
          </View>
        ))}
      </View>
      <View style={[s.yellowStrip, platePadding(11.5, 9)]}>
        <Text style={s.yellowStripText}>{clean(PITCH_COMPLEX.closing)}</Text>
      </View>
    </Slide>
  );
}

/** Макет 11 — что в старом подходе перестало работать. */
export function OldSeoSlide() {
  const half = 4;
  return (
    <Slide>
      <SlideHead title={PITCH_OLD_SEO.title} size={28} />
      <View style={s.leadBox}>
        <Text style={s.leadBoxText}>{clean(PITCH_OLD_SEO.lead)}</Text>
      </View>
      <Kicker style={{ fontSize: 12, marginBottom: 12 }}>{PITCH_OLD_SEO.kicker}</Kicker>
      <View style={s.cols}>
        <View style={s.col}>
          <Bullets items={PITCH_OLD_SEO.fails.slice(0, half)} size={12} gap={15} />
        </View>
        <View style={s.col}>
          <Bullets items={PITCH_OLD_SEO.fails.slice(half)} size={12} gap={15} />
          <View style={s.answerRow}>
            <View style={s.bangCell}>
              <Text style={s.bang}>!</Text>
            </View>
            <Text style={s.answerText}>{PITCH_OLD_SEO.answer}</Text>
          </View>
        </View>
      </View>
    </Slide>
  );
}

/** Кегль шапок карточек «экосистемы» — подобран так, чтобы ни одна не рвалась. */
const CARD_HEAD_FS = 12;

/** Макет 12 — экосистема из пяти типов SEO. */
export function EcosystemSlide() {
  const items = PITCH_ECOSYSTEM.items;
  const card = (it: (typeof items)[number]) => (
    <View key={it.title} style={s.card}>
      <View style={[s.cardHead, platePadding(CARD_HEAD_FS, 8)]}>
        <Text style={[s.cardHeadText, { fontSize: CARD_HEAD_FS }]}>{it.title}</Text>
      </View>
      <View style={s.cardBody}>
        <Text style={s.cardText}>{clean(it.text)}</Text>
      </View>
    </View>
  );

  return (
    <Slide>
      <SlideHead title={PITCH_ECOSYSTEM.title} size={28} style={{ marginBottom: 6 }} />
      <Text style={[s.lead, { marginBottom: 18 }]}>{clean(PITCH_ECOSYSTEM.lead)}</Text>
      <View style={[s.cardRow, s.cardRowGap]}>{items.slice(0, 3).map(card)}</View>
      {/* Нижний ряд из двух карточек центрируется распорками — так в макете. */}
      <View style={s.cardRow}>
        <View style={s.cardSpacer} />
        {items.slice(3).map(card)}
        <View style={s.cardSpacer} />
      </View>
    </Slide>
  );
}

/**
 * Макет 13 — путь клиента. Воронка приезжает растром из макета (текст ступеней
 * вшит в картинку), поэтому слайд собран абсолютными координатами макета.
 */
export function JourneySlide() {
  return (
    <Slide>
      <SlideHead
        title={PITCH_JOURNEY.title}
        subtitle={PITCH_JOURNEY.subtitle}
        size={30}
        subSize={17}
      />
      {/* Воронка «прибита» к координатам макета и заходит под зелёный подвал —
          поэтому она в Overlay (fixed), иначе пагинация зависает. */}
      <Overlay>
        <Image src={JOURNEY_FUNNEL} style={s.funnel} />
      </Overlay>
      <View style={s.journeyCol}>
        <Kicker>{PITCH_JOURNEY.kicker}</Kicker>
        <Bullets items={PITCH_JOURNEY.values} size={11} gap={13} />
      </View>
      <Rich text={PITCH_JOURNEY.closing} style={s.journeyClosing} />
    </Slide>
  );
}
