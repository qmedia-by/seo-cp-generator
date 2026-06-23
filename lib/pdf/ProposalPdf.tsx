// PDF коммерческого предложения по SEO. Формат A4 landscape, фирстиль Qmedia.
// Рендерится на сервере через @react-pdf/renderer.

import path from "node:path";
import React from "react";
import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { calculate } from "../calc";
import { ADVANTAGES, BRAND, COMPANY } from "../company";
import { formatHours, formatMoney, pluralMonths } from "../format";
import type { Proposal } from "../types";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const BRAND_DIR = path.join(process.cwd(), "public", "brand");
const Q_MARK = path.join(BRAND_DIR, "qmedia-q-white.png");

Font.register({
  family: "QmediaSans",
  fonts: [
    { src: path.join(FONT_DIR, "QmediaSans-Regular.ttf") },
    { src: path.join(FONT_DIR, "QmediaSans-Bold.ttf"), fontWeight: 700 },
  ],
});
// Без переносов по слогам — для кириллицы выглядит чище.
Font.registerHyphenationCallback((word) => [word]);

const s = StyleSheet.create({
  // Обложка
  cover: {
    fontFamily: "QmediaSans",
    backgroundColor: BRAND.black,
    color: BRAND.white,
    padding: 48,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  coverLabel: {
    color: BRAND.yellow,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  coverTitle: { fontSize: 40, fontWeight: 700, lineHeight: 1.1 },
  coverSite: { fontSize: 16, color: "#CFCFCF", marginTop: 14 },
  coverFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  coverPreparedLabel: { color: BRAND.yellow, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  qMark: { width: 44, height: 44 },

  // Контентные страницы
  page: {
    fontFamily: "QmediaSans",
    color: BRAND.ink,
    fontSize: 10,
    paddingTop: 38,
    paddingBottom: 46,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },
  sectionHead: { flexDirection: "row", alignItems: "center", marginBottom: 10, marginTop: 6 },
  accentSquare: { width: 8, height: 16, backgroundColor: BRAND.yellow, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: BRAND.black },

  paramsWrap: { flexDirection: "row", flexWrap: "wrap", marginBottom: 14 },
  paramBox: {
    width: "20%",
    paddingVertical: 6,
    paddingRight: 10,
  },
  paramLabel: { color: BRAND.gray, fontSize: 8, textTransform: "uppercase" },
  paramValue: { fontSize: 11, fontWeight: 700 },

  dir: { marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#ECECEC" },
  dirHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dirName: { fontSize: 13, fontWeight: 700, color: BRAND.black },
  dirGoal: { fontSize: 9, color: BRAND.gray, marginTop: 2, marginBottom: 6 },
  badgeOn: { backgroundColor: BRAND.yellow, color: BRAND.black, fontSize: 8, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, textTransform: "uppercase" },
  badgeOff: { backgroundColor: "#E5E5E5", color: BRAND.gray, fontSize: 8, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 7, borderRadius: 8, textTransform: "uppercase" },
  dirPrice: { fontSize: 10, color: BRAND.gray, marginBottom: 5 },
  dirPriceStrong: { color: BRAND.black, fontWeight: 700 },
  work: { flexDirection: "row", marginBottom: 2.5 },
  workBullet: { width: 10, color: BRAND.green, fontWeight: 700 },
  workText: { flex: 1, fontSize: 9.5 },
  excludedNote: { fontSize: 9, color: BRAND.mute },

  // Смета
  smeta: { backgroundColor: BRAND.black, color: BRAND.white, borderRadius: 12, padding: 18, marginTop: 6, marginBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  smetaCol: { flexDirection: "column" },
  smetaSmall: { fontSize: 9, color: "#BFBFBF" },
  smetaMid: { fontSize: 13, fontWeight: 700, lineHeight: 1, marginVertical: 2 },
  smetaTotalBox: { backgroundColor: BRAND.yellow, color: BRAND.black, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 18, alignItems: "flex-end" },
  smetaTotalLabel: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", opacity: 0.7 },
  smetaTotal: { fontSize: 24, fontWeight: 700, lineHeight: 1, marginVertical: 3 },

  // О компании
  statsRow: { flexDirection: "row", marginBottom: 16 },
  stat: { flex: 1, flexDirection: "column" },
  statNum: { fontSize: 24, fontWeight: 700, color: BRAND.black, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 9, color: BRAND.gray, lineHeight: 1.2 },
  advRow: { flexDirection: "row", flexWrap: "wrap" },
  adv: { width: "50%", paddingRight: 16, marginBottom: 10 },
  advTitle: { fontSize: 11, fontWeight: 700, color: BRAND.black, marginBottom: 2 },
  advText: { fontSize: 9, color: BRAND.gray },

  contacts: { flexDirection: "row", justifyContent: "space-between", marginTop: 8, paddingTop: 12, borderTopWidth: 2, borderTopColor: BRAND.yellow },
  contactName: { fontSize: 12, fontWeight: 700 },
  contactLine: { fontSize: 10, color: BRAND.gray },

  footerLeft: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 8, color: BRAND.mute },
});

// PT Sans не содержит ряд символов (стрелки) — заменяем на тире.
function clean(str: string): string {
  return str.replace(/[→←↔]/g, "—");
}

function SectionHead({ title }: { title: string }) {
  return (
    <View style={s.sectionHead}>
      <View style={s.accentSquare} />
      <Text style={s.sectionTitle}>{title}</Text>
    </View>
  );
}

export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const { input, directions, meta } = proposal;
  const calc = calculate(input, directions);
  const calcByKey = Object.fromEntries(
    calc.perDirection.map((d) => [d.key, d]),
  );

  const params: [string, string][] = [
    ["Регион", input.region],
    ["Срок", `${input.durationMonths} мес`],
    ["Для кого", input.audience],
    ["Что продвигаем", input.promoteType],
    ["Кол-во страниц", input.pages],
    ["Опыт SEO", input.experience],
    ["Ошибки", input.errors],
    ["Ссылочное", input.linkBuilding],
    ["Конкуренция", input.competition],
  ];

  return (
    <Document
      title={`КП по SEO — ${input.siteName}`}
      author={COMPANY.name}
    >
      {/* Обложка */}
      <Page size="A4" orientation="landscape" style={s.cover}>
        <Image src={Q_MARK} style={s.qMark} />
        <View>
          <Text style={s.coverLabel}>Коммерческое предложение</Text>
          <Text style={s.coverTitle}>SEO-продвижение</Text>
          <Text style={s.coverSite}>
            для {input.siteName}
            {meta?.clientName ? ` · ${meta.clientName}` : ""}
          </Text>
        </View>
        <View style={s.coverFooter}>
          <View>
            <Text style={s.coverPreparedLabel}>Подготовил</Text>
            <Text style={{ fontSize: 13, fontWeight: 700 }}>
              {COMPANY.manager.name}
            </Text>
            <Text style={{ fontSize: 10, color: "#BFBFBF" }}>
              {COMPANY.manager.role}
            </Text>
            <Text style={{ fontSize: 10, color: "#BFBFBF", marginTop: 4 }}>
              {COMPANY.manager.phone} · {COMPANY.manager.email}
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: BRAND.yellow, fontWeight: 700 }}>
            {COMPANY.site}
          </Text>
        </View>
      </Page>

      {/* Контент */}
      <Page size="A4" orientation="landscape" style={s.page} wrap>
        <SectionHead title="Параметры проекта" />
        <View style={s.paramsWrap}>
          <View style={s.paramBox}>
            <Text style={s.paramLabel}>Сайт</Text>
            <Text style={s.paramValue}>{input.siteName}</Text>
          </View>
          {params.map(([k, v]) => (
            <View key={k} style={s.paramBox}>
              <Text style={s.paramLabel}>{k}</Text>
              <Text style={s.paramValue}>{v}</Text>
            </View>
          ))}
        </View>

        <SectionHead title="Направления продвижения" />
        {directions.map((d) => {
          const c = calcByKey[d.key];
          return (
            <View key={d.key} style={s.dir} wrap>
              <View style={s.dirHeadRow} wrap={false}>
                <Text style={s.dirName}>{d.name}</Text>
                <Text style={d.included ? s.badgeOn : s.badgeOff}>
                  {d.included ? "включено" : "не входит"}
                </Text>
              </View>
              <Text style={s.dirGoal}>{clean(d.goal)}</Text>
              {d.included ? (
                <>
                  <Text style={s.dirPrice}>
                    Стоимость:{" "}
                    <Text style={s.dirPriceStrong}>
                      {formatMoney(c.monthlyPrice)}/мес
                    </Text>{" "}
                    · {formatHours(c.monthlyHours)}/мес
                  </Text>
                  {d.works.map((w, i) => (
                    <View key={i} style={s.work}>
                      <Text style={s.workBullet}>•</Text>
                      <Text style={s.workText}>{clean(w.text)}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={s.excludedNote}>
                  Не входит в текущее предложение.
                </Text>
              )}
            </View>
          );
        })}

        {/* Итоговая смета */}
        <View style={s.smeta} wrap={false}>
          <View style={s.smetaCol}>
            <Text style={s.smetaSmall}>Стоимость в месяц</Text>
            <Text style={s.smetaMid}>
              {formatMoney(calc.monthlyTotalPrice)}
            </Text>
            <Text style={s.smetaSmall}>
              {formatHours(calc.monthlyTotalHours)} / мес · срок{" "}
              {pluralMonths(calc.durationMonths)}
            </Text>
          </View>
          <View style={s.smetaTotalBox}>
            <Text style={s.smetaTotalLabel}>
              Итого за {pluralMonths(calc.durationMonths)}
            </Text>
            <Text style={s.smetaTotal}>{formatMoney(calc.totalPrice)}</Text>
            <Text style={{ fontSize: 8, opacity: 0.7 }}>
              {formatHours(calc.totalHours)} работ
            </Text>
          </View>
        </View>

        {/* О компании */}
        <SectionHead title={`О ${COMPANY.name}`} />
        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{COMPANY.foundedYear}</Text>
            <Text style={s.statLabel}>год основания</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{COMPANY.clients}</Text>
            <Text style={s.statLabel}>клиентов</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{COMPANY.employees}</Text>
            <Text style={s.statLabel}>специалистов в команде</Text>
          </View>
        </View>

        <SectionHead title="Почему Qmedia" />
        <View style={s.advRow}>
          {ADVANTAGES.map((a) => (
            <View key={a.title} style={s.adv}>
              <Text style={s.advTitle}>{a.title}</Text>
              <Text style={s.advText}>{a.text}</Text>
            </View>
          ))}
        </View>

        <View style={s.contacts} wrap={false}>
          <View>
            <Text style={s.contactName}>{COMPANY.manager.name}</Text>
            <Text style={s.contactLine}>{COMPANY.manager.role}</Text>
          </View>
          <View>
            <Text style={s.contactLine}>{COMPANY.manager.phone}</Text>
            <Text style={s.contactLine}>{COMPANY.manager.email}</Text>
            <Text style={[s.contactLine, { color: BRAND.black, fontWeight: 700 }]}>
              {COMPANY.site}
            </Text>
          </View>
        </View>

        <Text style={s.footerLeft} fixed>
          {COMPANY.name} · Коммерческое предложение по SEO · {COMPANY.site}
        </Text>
      </Page>
    </Document>
  );
}
