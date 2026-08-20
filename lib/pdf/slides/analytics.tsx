// Макет 26 — «Аналитика и отчётность»: что отслеживаем и в каком виде отдаём.
//
// Лист самый плотный по вертикали из статичных: три колонки метрик + блок
// формата отчётности. Меняешь кегли или отступы — перепроверяй числом листов
// в рендере (в 405 pt контент помещается впритык).

import React from "react";
import { StyleSheet, Text, View } from "@react-pdf/renderer";
import { PITCH_ANALYTICS } from "../../pitch";
import { Bullets, Kicker, Slide, SlideHead } from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  cols: { flexDirection: "row", gap: 14, marginTop: 6 },
  col: { flex: 1 },
  groupHead: {
    backgroundColor: DECK.green,
    borderRadius: R.md,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  groupTitle: { fontSize: 11, fontWeight: 700, color: DECK.white, lineHeight: 1 },

  reportHead: { flexDirection: "row", alignItems: "center", marginTop: 10 },
  reportBar: {
    width: 3.5,
    height: 14,
    backgroundColor: DECK.yellow,
    borderRadius: 1.5,
    marginRight: 8,
  },
  reportTitle: { fontSize: 10, fontWeight: 700, color: DECK.ink },
  reportText: {
    fontSize: 8.8,
    fontStyle: "italic",
    color: DECK.muted,
    lineHeight: 1.3,
    marginTop: 5,
  },
});

export function AnalyticsSlide() {
  return (
    <Slide>
      <SlideHead
        title={PITCH_ANALYTICS.title}
        subtitle={PITCH_ANALYTICS.subtitle}
        size={25}
        subSize={15}
      />
      <Kicker style={{ fontSize: 11 }}>{PITCH_ANALYTICS.kicker}</Kicker>
      <View style={s.cols}>
        {PITCH_ANALYTICS.groups.map((g) => (
          <View key={g.title} style={s.col}>
            <View style={[s.groupHead, platePadding(11, 8)]}>
              <Text style={s.groupTitle}>{g.title}</Text>
            </View>
            <Bullets items={g.items} size={9} gap={5} />
          </View>
        ))}
      </View>

      <View style={s.reportHead}>
        <View style={s.reportBar} />
        <Text style={s.reportTitle}>{PITCH_ANALYTICS.reportTitle}</Text>
      </View>
      <Text style={s.reportText}>{clean(PITCH_ANALYTICS.report)}</Text>
    </Slide>
  );
}
