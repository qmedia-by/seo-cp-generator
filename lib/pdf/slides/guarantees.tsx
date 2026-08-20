// Блок «Гарантии» (макеты 28–31): что гарантируем, что ждём от клиента,
// почему у других дешевле и какой платный инструментарий уже включён в работу.

import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LINKS } from "../../company";
import { PITCH_CHEAP, PITCH_EXPECTATIONS, PITCH_GUARANTEES, PITCH_TOOLS } from "../../pitch";
import { ICON, TOOL_LOGO } from "../assets";
import { Cursor, PillLink, Slide, SlideHead, SumText, rich } from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

/** Кегль «от 30 000 $» на жёлтой плашке слайда инструментария. */
const INVEST_FS = 30;

const s = StyleSheet.create({
  // --- Гарантируем передовые решения ---
  guaranteeRow: { flexDirection: "row", flexGrow: 1, alignItems: "center" },
  /**
   * Ширина под заголовок: «==передовые решения:==» должно идти одной строкой
   * (правка заказчика от 20.08.2026), а в Verdana оно шире, чем в PT Sans.
   */
  guaranteeLeft: { width: "45%", paddingRight: 20 },
  // Правое поле узкое: левую колонку забрал заголовок (см. `guaranteeLeft`),
  // а строки пунктов должны оставаться в две строки, а не в три.
  guaranteeRight: { flex: 1, paddingRight: 18 },
  iconItem: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  icon: { width: 50, height: 50, marginRight: 18 },
  iconText: { flex: 1, fontSize: 11, lineHeight: 1.4 },

  // --- Что мы ожидаем от вас ---
  /**
   * Два ряда по два пункта, разнесённые по высоте листа: свободное место
   * распределяет `space-around`, а не фиксированный отступ — иначе внизу
   * оставалась пустая треть слайда.
   */
  expectGrid: { flexGrow: 1, justifyContent: "space-around", marginTop: 10 },
  expectRow: { flexDirection: "row" },
  /**
   * Крупная цифра лежит ПОД текстом (в макете блок наезжает на неё примерно
   * наполовину), поэтому она абсолютная, а не колонка в строке: у «1» и «4»
   * разная ширина, и в потоке текст стоял бы на разном отступе.
   */
  expectCell: { width: "50%", paddingRight: 28, position: "relative" },
  expectNum: {
    position: "absolute",
    left: 0,
    top: 4,
    fontSize: 80,
    fontWeight: 700,
    fontStyle: "italic",
    color: DECK.yellowSoft,
    lineHeight: 1,
  },
  expectBody: { marginLeft: 26 },
  expectTitle: { fontSize: 17, fontWeight: 700, color: DECK.black, marginBottom: 10 },
  expectText: { fontSize: 12, lineHeight: 1.4 },
  handshake: { position: "absolute", right: 30, top: 6, width: 78, height: 78 },

  // --- Почему у других дешевле ---
  cheapGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 22 },
  cheapCell: { width: "50%", flexDirection: "row", paddingRight: 28, paddingBottom: 34 },
  cheapIcon: { width: 50, height: 50, marginRight: 16 },
  cheapText: { flex: 1, fontSize: 12, lineHeight: 1.4 },
  cheapClosing: {
    fontSize: 11.5,
    fontStyle: "italic",
    color: DECK.grey,
    lineHeight: 1.45,
    width: "80%",
  },

  // --- Платный инструментарий ---
  toolsRow: { flexDirection: "row", marginTop: 2 },
  toolsCol: { flex: 1, paddingRight: 14 },
  toolGroupTitle: { fontSize: 8.4, fontWeight: 700, color: DECK.ink, marginBottom: 2 },
  // Ряды разнесены: в макете между группами заметный воздух, а у нас снизу
  // оставалось пустое место (правка заказчика «увеличь gaps между рядами»).
  toolRow: { flexDirection: "row", marginBottom: 10 },
  tool: { flex: 1, alignItems: "center", paddingHorizontal: 3 },
  toolLogo: { width: 29, height: 29, marginBottom: 2, objectFit: "contain" },
  toolName: { fontSize: 6.6, fontWeight: 700, color: DECK.black, textAlign: "center", lineHeight: 1.2 },
  toolText: {
    fontSize: 4.6,
    fontStyle: "italic",
    color: DECK.greyLight,
    textAlign: "center",
    lineHeight: 1.2,
  },

  invest: { width: 212, alignItems: "center" },
  investLead: { fontSize: 11, fontWeight: 700, textAlign: "center", marginBottom: 6 },
  investPlate: {
    backgroundColor: DECK.yellow,
    borderRadius: R.md,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  investAmount: { fontWeight: 700, color: DECK.black },
  investNote: {
    fontSize: 8.5,
    fontWeight: 700,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 1.3,
  },
  investCta: { flexDirection: "row", alignItems: "flex-end", marginTop: 12 },
});

/** Макет 28 — чем гарантированно обеспечен проект. */
export function GuaranteesSlide() {
  return (
    <Slide>
      <View style={s.guaranteeRow}>
        <View style={s.guaranteeLeft}>
          <SlideHead title={PITCH_GUARANTEES.title} size={21} />
        </View>
        <View style={s.guaranteeRight}>
          {PITCH_GUARANTEES.items.map((it) => (
            <View key={it.text} style={s.iconItem}>
              <Image src={ICON[it.icon as keyof typeof ICON]} style={s.icon} />
              <Text style={s.iconText}>{rich(it.text)}</Text>
            </View>
          ))}
        </View>
      </View>
    </Slide>
  );
}

/** Макет 29 — что мы ожидаем от клиента. Крупные цифры — жирный курсив. */
export function ExpectationsSlide() {
  return (
    <Slide>
      <SlideHead title={PITCH_EXPECTATIONS.title} size={27} />
      <Image src={ICON.handshake} style={s.handshake} />
      <View style={s.expectGrid}>
        {[0, 2].map((from) => (
          <View key={from} style={s.expectRow}>
            {PITCH_EXPECTATIONS.items.slice(from, from + 2).map((it, i) => (
              <View key={it.title} style={s.expectCell}>
                <Text style={s.expectNum}>{from + i + 1}</Text>
                <View style={s.expectBody}>
                  <Text style={s.expectTitle}>{clean(it.title)}</Text>
                  <Text style={s.expectText}>{rich(it.text)}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Slide>
  );
}

/** Макет 30 — почему у других может быть значительно дешевле. */
export function CheapSlide() {
  return (
    <Slide>
      <SlideHead title={PITCH_CHEAP.title} size={26} />
      <View style={s.cheapGrid}>
        {PITCH_CHEAP.items.map((text) => (
          <View key={text} style={s.cheapCell}>
            <Image src={ICON.warning} style={s.cheapIcon} />
            <Text style={s.cheapText}>{rich(text)}</Text>
          </View>
        ))}
      </View>
      {/* Распорка + нижний отступ: `flexGrow` один прижимал бы вывод вплотную
          к подвалу (правка заказчика от 20.08.2026). */}
      <View style={{ flexGrow: 1 }} />
      <Text style={[s.cheapClosing, { marginBottom: 18 }]}>
        {clean(PITCH_CHEAP.closing)}
      </Text>
    </Slide>
  );
}

/** Макет 31 — платный SEO-стек, уже включённый в работу. */
export function ToolsSlide() {
  return (
    <Slide>
      <SlideHead
        title={PITCH_TOOLS.title}
        subtitle={PITCH_TOOLS.subtitle}
        size={25}
        subSize={15}
      />
      <View style={s.toolsRow}>
        <View style={s.toolsCol}>
          {PITCH_TOOLS.groups.map((g) => (
            <View key={g.title}>
              <Text style={s.toolGroupTitle}>{g.title}</Text>
              <View style={s.toolRow}>
                {g.items.map((t) => (
                  <View key={t.name} style={s.tool}>
                    <Image
                      src={TOOL_LOGO[t.logo as keyof typeof TOOL_LOGO]}
                      style={s.toolLogo}
                    />
                    <Text style={s.toolName}>{t.name}</Text>
                    <Text style={s.toolText}>{clean(t.text)}</Text>
                  </View>
                ))}
                {/* Ряд с четырьмя сервисами добиваем распоркой, чтобы карточки
                    стояли в тех же колонках, что и в рядах из пяти. */}
                {g.items.length < 5 &&
                  Array.from({ length: 5 - g.items.length }, (_, i) => (
                    <View key={`gap${i}`} style={s.tool} />
                  ))}
              </View>
            </View>
          ))}
        </View>

        <View style={s.invest}>
          <Text style={s.investLead}>{PITCH_TOOLS.investLead}</Text>
          {/* «от» и сумма — одной строкой (правка заказчика от 20.08.2026):
              приставка мельче цифры, но на той же базовой линии. */}
          <View style={[s.investPlate, platePadding(INVEST_FS, 8)]}>
            <SumText
              text={`${PITCH_TOOLS.investPrefix} ${PITCH_TOOLS.investAmount}`}
              size={INVEST_FS}
              style={s.investAmount}
            />
          </View>
          <Text style={s.investNote}>{clean(PITCH_TOOLS.investNote)}</Text>
          <View style={s.investCta}>
            <PillLink href={LINKS.paidTools} size={8}>
              {PITCH_TOOLS.moreLabel}
            </PillLink>
            <Cursor size={24} style={{ marginLeft: -6, marginBottom: -10 }} />
          </View>
        </View>
      </View>
    </Slide>
  );
}
