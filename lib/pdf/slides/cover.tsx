// Обложка КП (макеты 1–8).
//
// Слайд собран абсолютными координатами макета: композиция фиксированная, а
// меняются только имя клиента и карточка менеджера, который КП подготовил.
// Формулировка «Подготовлено:» вместо «Подготовил(а):» — по правке заказчика,
// чтобы не склонять по родам.

import React from "react";
import { Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { COMPANY } from "../../company";
import type { ProposalManager } from "../../types";
import { LOGO } from "../assets";
import type { PdfPhoto } from "../photos";
import { Avatar, GreenBg, Overlay, QMark } from "../primitives";
import {
  clean,
  COVER_WATERMARK_OPACITY,
  DECK,
  FONT,
  PAGE_SIZE,
  platePadding,
  R,
  WORDMARK_RATIO,
} from "../theme";

const TITLE_FS = 34;

const s = StyleSheet.create({
  page: { fontFamily: FONT, position: "relative" },
  ring: { position: "absolute", top: -60, left: 250, width: 500, height: 500 },
  logo: { position: "absolute", top: 20, left: 30.5, height: 62, width: 62 * WORDMARK_RATIO },

  title: { position: "absolute", top: 128, left: 25, width: 660 },
  titleLine: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 5,
    marginBottom: 4,
  },
  titleText: {
    fontSize: TITLE_FS,
    fontWeight: 700,
    color: DECK.black,
    lineHeight: 1,
  },

  client: {
    position: "absolute",
    top: 228,
    left: 25,
    width: 660,
    fontSize: 21,
    fontWeight: 700,
    color: DECK.white,
    lineHeight: 1.15,
  },

  manager: { position: "absolute", top: 292, left: 33, right: 40, flexDirection: "row" },
  managerBody: { marginLeft: 12, justifyContent: "center" },
  preparedBy: { fontSize: 10, color: DECK.white, opacity: 0.9, marginBottom: 2 },
  managerName: { fontSize: 12, fontWeight: 700, color: DECK.white },
  managerRole: { fontSize: 11, fontStyle: "italic", color: DECK.white },
});

export function CoverSlide({
  clientName,
  manager,
  photo,
}: {
  /** Кому предложение: название клиента или сайта. */
  clientName: string;
  manager: ProposalManager;
  photo?: PdfPhoto;
}) {
  const name = manager.name || COMPANY.manager.name;
  const role = manager.role || COMPANY.manager.role;

  return (
    <Page size={PAGE_SIZE} style={s.page}>
      <GreenBg />
      {/* Кольцо «Q» — вектором: растр на 500 pt мылил, и заказчик просил
          сделать знак заметнее (было 15% прозрачности). */}
      <Overlay>
        <QMark color={DECK.white} opacity={COVER_WATERMARK_OPACITY} style={s.ring} />
      </Overlay>
      <Image src={LOGO.wordmarkWhite} style={s.logo} />

      <View style={s.title}>
        {["Комплексное", "SEO-продвижение"].map((line) => (
          <View key={line} style={[s.titleLine, platePadding(TITLE_FS, 5)]}>
            <Text style={s.titleText}>{line}</Text>
          </View>
        ))}
      </View>

      <Text style={s.client}>для {clean(clientName)}</Text>

      <View style={s.manager}>
        <Avatar src={photo ?? null} name={name} size={58} ring={2.5} />
        <View style={s.managerBody}>
          <Text style={s.preparedBy}>Подготовлено:</Text>
          <Text style={s.managerName}>{name}</Text>
          {!!role && <Text style={s.managerRole}>{role}</Text>}
        </View>
      </View>
    </Page>
  );
}
