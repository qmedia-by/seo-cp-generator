// Блок «Гарантии» (макеты 28–31): что гарантируем, что ждём от клиента,
// почему у других дешевле и какой платный инструментарий уже включён в работу.

import React from "react";
import { Image, StyleSheet, Text, View } from "@react-pdf/renderer";
import { LINKS } from "../../company";
import { PITCH_CHEAP, PITCH_EXPECTATIONS, PITCH_GUARANTEES, PITCH_TOOLS } from "../../pitch";
import { ICON, TOOL_LOGO } from "../assets";
import { Cursor, PillLink, Slide, SlideHead, rich } from "../primitives";
import { clean, DECK, platePadding, R } from "../theme";

const s = StyleSheet.create({
  // --- Гарантируем передовые решения ---
  guaranteeRow: { flexDirection: "row", flexGrow: 1, alignItems: "center" },
  guaranteeLeft: { width: "42%", paddingRight: 20 },
  guaranteeRight: { flex: 1 },
  iconItem: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  icon: { width: 44, height: 44, marginRight: 16 },
  iconText: { flex: 1, fontSize: 11, lineHeight: 1.35 },

  // --- Что мы ожидаем от вас ---
  expectGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  expectCell: { width: "50%", flexDirection: "row", paddingRight: 24, paddingBottom: 14 },
  expectNum: {
    width: 46,
    fontSize: 62,
    fontWeight: 700,
    fontStyle: "italic",
    color: DECK.yellowSoft,
    lineHeight: 1,
  },
  expectBody: { flex: 1, marginLeft: 4 },
  expectTitle: { fontSize: 15, fontWeight: 700, color: DECK.black, marginBottom: 3 },
  expectText: { fontSize: 9.5, lineHeight: 1.35 },
  handshake: { position: "absolute", right: 30, top: 6, width: 78, height: 78 },

  // --- Почему у других дешевле ---
  cheapGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  cheapCell: { width: "50%", flexDirection: "row", paddingRight: 24, paddingBottom: 18 },
  cheapIcon: { width: 44, height: 44, marginRight: 14 },
  cheapText: { flex: 1, fontSize: 11, lineHeight: 1.35 },
  cheapClosing: {
    fontSize: 10.5,
    fontStyle: "italic",
    color: DECK.grey,
    lineHeight: 1.4,
    width: "80%",
  },

  // --- Платный инструментарий ---
  toolsRow: { flexDirection: "row", marginTop: 2 },
  toolsCol: { flex: 1, paddingRight: 14 },
  toolGroupTitle: { fontSize: 8.5, fontWeight: 700, color: DECK.ink, marginBottom: 2 },
  toolRow: { flexDirection: "row", marginBottom: 3 },
  tool: { flex: 1, alignItems: "center", paddingHorizontal: 3 },
  toolLogo: { width: 30, height: 30, marginBottom: 2, objectFit: "contain" },
  toolName: { fontSize: 6.8, fontWeight: 700, color: DECK.black, textAlign: "center", lineHeight: 1.2 },
  toolText: {
    fontSize: 4.9,
    fontStyle: "italic",
    color: DECK.greyLight,
    textAlign: "center",
    lineHeight: 1.25,
  },

  invest: { width: 200, alignItems: "center" },
  investLead: { fontSize: 11, fontWeight: 700, textAlign: "center", marginBottom: 6 },
  investPlate: {
    backgroundColor: DECK.yellow,
    borderRadius: R.md,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  investFrom: { fontSize: 14, color: DECK.black, lineHeight: 1 },
  investAmount: { fontSize: 34, fontWeight: 700, color: DECK.black, lineHeight: 1 },
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
          <SlideHead title={PITCH_GUARANTEES.title} size={24} />
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
      <SlideHead title={PITCH_EXPECTATIONS.title} size={25} />
      <Image src={ICON.handshake} style={s.handshake} />
      <View style={s.expectGrid}>
        {PITCH_EXPECTATIONS.items.map((it, i) => (
          <View key={it.title} style={s.expectCell}>
            <Text style={s.expectNum}>{i + 1}</Text>
            <View style={s.expectBody}>
              <Text style={s.expectTitle}>{it.title}</Text>
              <Text style={s.expectText}>{rich(it.text)}</Text>
            </View>
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
      <SlideHead title={PITCH_CHEAP.title} size={25} />
      <View style={s.cheapGrid}>
        {PITCH_CHEAP.items.map((text) => (
          <View key={text} style={s.cheapCell}>
            <Image src={ICON.warning} style={s.cheapIcon} />
            <Text style={s.cheapText}>{rich(text)}</Text>
          </View>
        ))}
      </View>
      <Text style={s.cheapClosing}>{clean(PITCH_CHEAP.closing)}</Text>
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
          <View style={[s.investPlate, platePadding(34, 8)]}>
            <Text style={s.investFrom}>{PITCH_TOOLS.investPrefix}</Text>
            <Text style={s.investAmount}>{PITCH_TOOLS.investAmount}</Text>
          </View>
          <Text style={s.investNote}>{clean(PITCH_TOOLS.investNote)}</Text>
          <View style={s.investCta}>
            <PillLink href={LINKS.paidTools} size={9}>
              {PITCH_TOOLS.moreLabel}
            </PillLink>
            <Cursor size={24} style={{ marginLeft: -6, marginBottom: -10 }} />
          </View>
        </View>
      </View>
    </Slide>
  );
}
