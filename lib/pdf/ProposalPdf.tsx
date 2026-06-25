// PDF коммерческого предложения по SEO. Формат A4 landscape, фирстиль Qmedia.
// Оформление повторяет референс sources/cp-development.pdf: зелёный заглавный
// слайд с фото и белым логотипом, зелёный градиентный колонтитул с Q-watermark
// на каждом слайде, жёлтые акценты. Рендерится на сервере (@react-pdf/renderer).

import path from "node:path";
import React from "react";
import {
  Circle,
  Defs,
  Document,
  Font,
  Image,
  LinearGradient,
  Page,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { calculateSchedule } from "../calc";
import { ADVANTAGES, BRAND, COMPANY } from "../company";
import { formatHours, formatInt, formatMoney, pluralMonths } from "../format";
import type { Proposal } from "../types";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const BRAND_DIR = path.join(process.cwd(), "public", "brand");
const IMG_DIR = path.join(process.cwd(), "public", "images");
const WORDMARK = path.join(BRAND_DIR, "qmedia-wordmark-white.png");
const Q_MARK = path.join(BRAND_DIR, "qmedia-q-white.png");
const COVER_PHOTO = path.join(IMG_DIR, "print-004.jpg");

// Геометрия A4 landscape в пунктах и пропорции логотипа.
const PAGE_W = 842;
const PAGE_H = 595;
const BAND_H = 64;
const WORDMARK_RATIO = 2048 / 656; // ≈ 3.12

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
  // --- Обложка ---
  cover: { fontFamily: "QmediaSans", position: "relative" },
  coverFill: { position: "absolute", top: 0, left: 0, width: PAGE_W, height: PAGE_H },
  coverPhoto: { objectFit: "cover" },
  coverOverlay: { backgroundColor: BRAND.green, opacity: 0.86 },
  coverLogoWrap: { position: "absolute", top: 44, left: 0, right: 0, alignItems: "center" },
  coverLogo: { height: 40, width: 40 * WORDMARK_RATIO },
  coverCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 80,
  },
  coverTitle: {
    color: BRAND.white,
    fontSize: 46,
    fontWeight: 700,
    lineHeight: 1,
    textAlign: "center",
    marginBottom: 14,
  },
  coverSubtitle: { color: BRAND.white, fontSize: 16, textAlign: "center", opacity: 0.95 },
  coverContacts: { position: "absolute", bottom: 42, left: 0, right: 0, alignItems: "center" },
  coverPrepared: { color: BRAND.white, fontSize: 11, textAlign: "center", opacity: 0.9 },
  coverPreparedName: { color: BRAND.white, fontSize: 13, fontWeight: 700, textAlign: "center" },
  coverContactLine: { color: BRAND.white, fontSize: 11, textAlign: "center", opacity: 0.92, marginTop: 2 },
  coverSite: { color: BRAND.white, fontSize: 12, fontWeight: 700, textAlign: "center", marginTop: 6 },

  // --- Колонтитул (header band) ---
  band: { position: "absolute", top: 0, left: 0, width: PAGE_W, height: BAND_H, overflow: "hidden" },
  bandBg: { position: "absolute", top: 0, left: 0 },
  bandMark: { position: "absolute", top: -34, right: -8, width: 130, height: 130, opacity: 0.12 },
  bandLogo: { position: "absolute", top: (BAND_H - 20) / 2, left: 40, height: 20, width: 20 * WORDMARK_RATIO },
  bandTitle: {
    position: "absolute",
    top: (BAND_H - 22) / 2,
    left: 0,
    right: 40,
    textAlign: "right",
    color: BRAND.white,
    fontSize: 19,
    fontWeight: 700,
  },

  // --- Подвал ---
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, paddingBottom: 16, paddingTop: 6 },
  footerRule: { height: 2, backgroundColor: BRAND.green, marginHorizontal: 40, marginBottom: 6, opacity: 0.8 },
  footerText: { textAlign: "center", fontSize: 8, color: BRAND.mute },

  // --- Контентная страница ---
  page: {
    fontFamily: "QmediaSans",
    color: BRAND.ink,
    fontSize: 10,
    paddingTop: BAND_H + 14,
    paddingBottom: 30,
    paddingHorizontal: 40,
    lineHeight: 1.4,
  },

  subHead: { flexDirection: "row", alignItems: "center", marginBottom: 9, marginTop: 4 },
  subBar: { width: 5, height: 16, backgroundColor: BRAND.green, borderRadius: 2, marginRight: 8 },
  subTitle: { fontSize: 14, fontWeight: 700, color: BRAND.ink },

  // Смета: две колонки
  smetaRow: { flexDirection: "row", gap: 18, marginBottom: 12 },
  smetaColLeft: { width: "54%" },
  smetaColRight: { width: "46%" },

  paramsGrid: { flexDirection: "row", flexWrap: "wrap" },
  paramBox: { width: "50%", paddingVertical: 5, paddingRight: 10 },
  paramLabel: { color: BRAND.gray, fontSize: 8, textTransform: "uppercase" },
  paramValue: { fontSize: 11, fontWeight: 700, color: BRAND.ink },

  costCard: { backgroundColor: BRAND.greenTint, borderRadius: 12, padding: 14 },
  costCardLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: BRAND.greenDark, letterSpacing: 1 },
  costHighlight: { backgroundColor: BRAND.yellow, alignSelf: "flex-start", paddingVertical: 7, paddingHorizontal: 12, borderRadius: 6, marginTop: 6, marginBottom: 8 },
  costHighlightText: { fontSize: 27, fontWeight: 700, color: BRAND.ink, lineHeight: 1 },
  costDivider: { height: 1, backgroundColor: "#CFE6C7", marginVertical: 6 },
  costLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 },
  costLineLabel: { fontSize: 10, color: BRAND.gray },
  costLineValue: { fontSize: 11, fontWeight: 700, color: BRAND.ink },

  // Таблица направлений (смета)
  tHead: { flexDirection: "row", backgroundColor: BRAND.green, borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  tHeadCell: { color: BRAND.white, fontSize: 9, fontWeight: 700, paddingVertical: 5, paddingHorizontal: 8 },
  tRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#ECECEC", alignItems: "center" },
  tCell: { fontSize: 9.5, paddingVertical: 4, paddingHorizontal: 8 },
  tTotal: { flexDirection: "row", backgroundColor: BRAND.greenTint, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, alignItems: "center" },
  tTotalCell: { fontSize: 10, fontWeight: 700, color: BRAND.ink, paddingVertical: 5, paddingHorizontal: 8 },
  cName: { width: "46%" },
  cStatus: { width: "20%" },
  cHours: { width: "16%", textAlign: "right" },
  cPrice: { width: "18%", textAlign: "right" },
  cPriceWrap: { width: "18%", paddingVertical: 6, paddingHorizontal: 8, alignItems: "flex-end" },
  cPriceFinal: { fontSize: 9.5 },
  cPriceStrike: { fontSize: 8, color: BRAND.gray, textDecoration: "line-through" },

  // Матрица «направления × месяцы»
  mtxHeadCellCenter: { color: BRAND.white, fontSize: 8.5, fontWeight: 700, paddingVertical: 5, paddingHorizontal: 2, textAlign: "center" },
  // Маркер активного месяца рисуем View-кружком: в шрифте нет глифа «✓».
  mtxCell: { paddingVertical: 4, alignItems: "center", justifyContent: "center" },
  dotOn: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND.green },
  dotOff: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D5D5D5" },
  mtxTermCell: { fontSize: 9.5, paddingVertical: 4, paddingHorizontal: 8, textAlign: "right" },
  mtxTotalCellCenter: { fontSize: 8, fontWeight: 700, color: BRAND.ink, paddingVertical: 5, paddingHorizontal: 2, textAlign: "center" },

  badgeOn: { color: BRAND.greenDark, fontWeight: 700 },
  badgeOff: { color: BRAND.mute },
  muted: { color: BRAND.mute },

  // Направления (детально)
  dir: { marginBottom: 11, paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: "#ECECEC" },
  dirHeadRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dirNameWrap: { flexDirection: "row", alignItems: "center", flex: 1 },
  dirDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  dirName: { fontSize: 13, fontWeight: 700, color: BRAND.ink },
  dirGoal: { fontSize: 9, color: BRAND.gray, marginTop: 3, marginBottom: 6 },
  dirBadgeOn: { backgroundColor: BRAND.green, color: BRAND.white, fontSize: 8, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, textTransform: "uppercase" },
  dirBadgeOff: { backgroundColor: "#E7E7E7", color: BRAND.gray, fontSize: 8, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, textTransform: "uppercase" },
  dirPrice: { fontSize: 9, color: BRAND.gray, marginBottom: 5 },
  dirPriceStrong: { color: BRAND.greenDark, fontWeight: 700 },
  dirPriceStrike: { color: BRAND.gray, textDecoration: "line-through" },
  work: { flexDirection: "row", marginBottom: 2.5 },
  workBullet: { width: 10, color: BRAND.green, fontWeight: 700 },
  workText: { flex: 1, fontSize: 9.5 },
  excludedNote: { fontSize: 9, color: BRAND.mute },

  // О компании
  statsRow: { flexDirection: "row", marginBottom: 18, gap: 12 },
  stat: { flex: 1 },
  statNum: { fontSize: 26, fontWeight: 700, color: BRAND.green, lineHeight: 1, marginBottom: 4 },
  statLabel: { fontSize: 9, color: BRAND.gray, lineHeight: 1.2 },
  advRow: { flexDirection: "row", flexWrap: "wrap" },
  adv: { width: "50%", paddingRight: 16, marginBottom: 11, flexDirection: "row" },
  advDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND.green, marginTop: 4, marginRight: 8 },
  advTitle: { fontSize: 11, fontWeight: 700, color: BRAND.ink, marginBottom: 2 },
  advText: { fontSize: 9, color: BRAND.gray },

  contacts: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 12, borderTopWidth: 2, borderTopColor: BRAND.green },
  contactName: { fontSize: 12, fontWeight: 700, color: BRAND.ink },
  contactLine: { fontSize: 10, color: BRAND.gray },
});

// PT Sans не содержит ряд символов (стрелки) — заменяем на тире.
function clean(str: string): string {
  return str.replace(/[→←↔]/g, "—");
}

/** Зелёный градиент + Q-watermark — фон колонтитула. */
function BandBg() {
  return (
    <Svg width={PAGE_W} height={BAND_H} style={s.bandBg}>
      <Defs>
        <LinearGradient id="band" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={BRAND.greenDeep} />
          <Stop offset="0.55" stopColor={BRAND.green} />
          <Stop offset="1" stopColor="#6BC94F" />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={PAGE_W} height={BAND_H} fill="url(#band)" />
      {/* Тональные круги мотива «Q» справа */}
      <Circle cx={PAGE_W - 120} cy={70} r={70} fill={BRAND.white} fillOpacity={0.06} />
      <Circle cx={PAGE_W - 60} cy={10} r={48} fill={BRAND.white} fillOpacity={0.05} />
    </Svg>
  );
}

/** Колонтитул (повторяется на каждом печатном листе). */
function HeaderBand({ title }: { title: string }) {
  return (
    <View style={s.band} fixed>
      <BandBg />
      <Image src={Q_MARK} style={s.bandMark} />
      <Image src={WORDMARK} style={s.bandLogo} />
      <Text style={s.bandTitle}>{title}</Text>
    </View>
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <View style={s.footerRule} />
      <Text style={s.footerText}>
        {COMPANY.name} · Коммерческое предложение по SEO · {COMPANY.site}
      </Text>
    </View>
  );
}

function SubHead({ title }: { title: string }) {
  return (
    <View style={s.subHead}>
      <View style={s.subBar} />
      <Text style={s.subTitle}>{title}</Text>
    </View>
  );
}

export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const { input, directions, meta } = proposal;
  const calc = calculateSchedule(input, directions);
  const calcByKey = Object.fromEntries(calc.perDirection.map((d) => [d.key, d]));
  const term = pluralMonths(calc.durationMonths);
  const clientLabel = meta?.clientName || input.siteName;

  // Геометрия матрицы «направления × месяцы».
  const nMonths = calc.durationMonths;
  const monthNums = calc.months.map((m) => m.month);
  const nameW = "34%";
  const termW = "16%";
  const monthW = `${50 / nMonths}%`;

  const params: [string, string][] = [
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
    <Document title={`КП по SEO — ${input.siteName}`} author={COMPANY.name}>
      {/* ── Обложка ── */}
      <Page size="A4" orientation="landscape" style={s.cover}>
        <Image src={COVER_PHOTO} style={[s.coverFill, s.coverPhoto]} />
        <View style={[s.coverFill, s.coverOverlay]} />
        {/* Q-watermark обязательно в контейнере с overflow:hidden — абсолютная
            картинка с отрицательным смещением прямо в <Page> вешает раскладку. */}
        <View style={[s.coverFill, { overflow: "hidden" }]}>
          <Image src={Q_MARK} style={{ position: "absolute", top: 90, left: -140, width: 520, height: 520, opacity: 0.1 }} />
          <Image src={Q_MARK} style={{ position: "absolute", top: -80, right: -120, width: 360, height: 360, opacity: 0.08 }} />
        </View>

        <View style={s.coverLogoWrap}>
          <Image src={WORDMARK} style={s.coverLogo} />
        </View>

        <View style={s.coverCenter}>
          <Text style={s.coverTitle}>SEO-продвижение</Text>
          <Text style={s.coverSubtitle}>
            Предложение для компании{" "}
            <Text style={{ fontWeight: 700 }}>{clientLabel}</Text>
          </Text>
        </View>

        <View style={s.coverContacts}>
          <Text style={s.coverPrepared}>Подготовил:</Text>
          <Text style={s.coverPreparedName}>{COMPANY.manager.name}</Text>
          <Text style={s.coverContactLine}>{COMPANY.manager.role}</Text>
          <Text style={[s.coverContactLine, { marginTop: 8 }]}>
            {COMPANY.manager.phone}
          </Text>
          <Text style={s.coverContactLine}>{COMPANY.manager.email}</Text>
          <Text style={s.coverSite}>{COMPANY.site}</Text>
        </View>
      </Page>

      {/* ── Смета ── */}
      <Page size="A4" orientation="landscape" style={s.page}>
        <HeaderBand title="Смета" />

        <View style={s.smetaRow}>
          <View style={s.smetaColLeft}>
            <SubHead title="Параметры проекта" />
            <View style={s.paramsGrid}>
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
          </View>

          <View style={s.smetaColRight}>
            <SubHead title="Общая стоимость" />
            <View style={s.costCard}>
              <Text style={s.costCardLabel}>Итого за {term}</Text>
              <View style={s.costHighlight}>
                <Text style={s.costHighlightText}>{formatMoney(calc.totalPrice)}</Text>
              </View>
              {calc.totalDiscount > 0 && (
                <>
                  <View style={s.costLine}>
                    <Text style={s.costLineLabel}>Стоимость за срок без скидки</Text>
                    <Text style={[s.costLineValue, s.dirPriceStrike]}>
                      {formatMoney(calc.totalFullPrice)}
                    </Text>
                  </View>
                  <View style={s.costLine}>
                    <Text style={s.costLineLabel}>Скидка за срок (Коммерческое SEO)</Text>
                    <Text style={[s.costLineValue, { color: BRAND.greenDark }]}>
                      −{formatMoney(calc.totalDiscount)}
                    </Text>
                  </View>
                </>
              )}
              <View style={s.costDivider} />
              <View style={s.costLine}>
                <Text style={s.costLineLabel}>Всего часов за проект</Text>
                <Text style={s.costLineValue}>{formatHours(calc.totalHours)}</Text>
              </View>
              <View style={s.costLine}>
                <Text style={s.costLineLabel}>Срок продвижения</Text>
                <Text style={s.costLineValue}>{term}</Text>
              </View>
            </View>
          </View>
        </View>

        <SubHead title="Состав по месяцам" />
        <View style={s.tHead}>
          <Text style={[s.tHeadCell, { width: nameW }]}>Направление</Text>
          {monthNums.map((m) => (
            <Text key={m} style={[s.mtxHeadCellCenter, { width: monthW }]}>
              {m}
            </Text>
          ))}
          <Text style={[s.tHeadCell, s.cPrice, { width: termW }]}>За срок</Text>
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
              {monthNums.map((m) => (
                <View key={m} style={[s.mtxCell, { width: monthW }]}>
                  <View style={active.has(m) ? s.dotOn : s.dotOff} />
                </View>
              ))}
              <Text
                style={[
                  s.mtxTermCell,
                  { width: termW },
                  included ? {} : s.muted,
                  included && discounted ? { color: BRAND.greenDark } : {},
                ]}
              >
                {included ? formatMoney(d.totalPrice) : "—"}
              </Text>
            </View>
          );
        })}
        <View style={s.tTotal} wrap={false}>
          <Text style={[s.tTotalCell, { width: nameW }]}>
            Стоимость / мес, {calc.currency}
          </Text>
          {calc.months.map((m) => (
            <Text
              key={m.month}
              style={[s.mtxTotalCellCenter, { width: monthW }]}
            >
              {formatInt(Math.round(m.monthlyTotalPrice))}
            </Text>
          ))}
          <Text style={[s.tTotalCell, s.cPrice, { width: termW }]}>
            {formatMoney(calc.totalPrice)}
          </Text>
        </View>

        <Footer />
      </Page>

      {/* ── Направления продвижения ── */}
      <Page size="A4" orientation="landscape" style={s.page} wrap>
        <HeaderBand title="Направления продвижения" />
        {directions.map((d) => {
          const c = calcByKey[d.key];
          const included = c.activeMonths.length > 0;
          const discounted = c.totalFullPrice > c.totalPrice;
          return (
            <View key={d.key} style={s.dir} wrap={false}>
              <View style={s.dirHeadRow}>
                <View style={s.dirNameWrap}>
                  <View style={[s.dirDot, { backgroundColor: included ? BRAND.green : "#D0D0D0" }]} />
                  <Text style={s.dirName}>{d.name}</Text>
                </View>
                <Text style={included ? s.dirBadgeOn : s.dirBadgeOff}>
                  {included ? c.monthsLabel : "не входит"}
                </Text>
              </View>
              <Text style={s.dirGoal}>{clean(d.goal)}</Text>
              {included ? (
                <>
                  <Text style={s.dirPrice}>
                    Стоимость за срок:{" "}
                    {discounted && (
                      <Text style={s.dirPriceStrike}>
                        {formatMoney(c.totalFullPrice)}{" "}
                      </Text>
                    )}
                    <Text style={s.dirPriceStrong}>{formatMoney(c.totalPrice)}</Text>
                    {discounted ? " (со скидкой за Коммерческое SEO)" : ""}{" "}
                    · {c.monthsLabel} · {formatHours(c.totalHours)} за срок
                  </Text>
                  {d.works.map((w, i) => (
                    <View key={i} style={s.work}>
                      <Text style={s.workBullet}>•</Text>
                      <Text style={s.workText}>{clean(w.text)}</Text>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={s.excludedNote}>Не входит в текущее предложение.</Text>
              )}
            </View>
          );
        })}
        <Footer />
      </Page>

      {/* ── О Qmedia ── */}
      <Page size="A4" orientation="landscape" style={s.page} wrap>
        <HeaderBand title={`О ${COMPANY.name}`} />

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

        <SubHead title="Почему Qmedia" />
        <View style={s.advRow}>
          {ADVANTAGES.map((a) => (
            <View key={a.title} style={s.adv}>
              <View style={s.advDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.advTitle}>{a.title}</Text>
                <Text style={s.advText}>{a.text}</Text>
              </View>
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
            <Text style={[s.contactLine, { color: BRAND.greenDark, fontWeight: 700 }]}>
              {COMPANY.site}
            </Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
