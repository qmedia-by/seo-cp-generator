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
  Path,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { calculateSchedule } from "../calc";
import { mergeCalcConfig } from "../calc-config";
import { ADVANTAGES, BRAND, COMPANY, PHOTOS } from "../company";
import {
  formatAmount,
  formatHours,
  formatInt,
  formatMonthlyAmount,
  formatMonthlyHours,
  formatMonthlyMoney,
  formatMoney,
  pluralMonths,
} from "../format";
import {
  PITCH_ANALYTICS,
  PITCH_CLIENTS,
  PITCH_COMPLEX,
  PITCH_DIRECTIONS,
  PITCH_ECOSYSTEM,
  PITCH_GUARANTEES,
  PITCH_JOURNEY,
  PITCH_OLD_SEO,
  PITCH_PM,
  PITCH_TEAM,
  PITCH_TOOLS,
  PITCH_WHY,
  type PitchNote,
} from "../pitch";
import type {
  DirectionScheduleCalc,
  DirectionSelection,
  Proposal,
} from "../types";

const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const BRAND_DIR = path.join(process.cwd(), "public", "brand");
const IMG_DIR = path.join(process.cwd(), "public", "images");
const WORDMARK = path.join(BRAND_DIR, "qmedia-wordmark-white.png");
const Q_MARK = path.join(BRAND_DIR, "qmedia-q-white.png");
const COVER_PHOTO = path.join(IMG_DIR, PHOTOS.cover);
const CLIENTS_PHOTO = path.join(IMG_DIR, "print-001.jpg");

// Геометрия A4 landscape в пунктах и пропорции логотипа.
const PAGE_W = 842;
const PAGE_H = 595;
const BAND_H = 64;
const BAND_RULE_H = 3; // жёлтая отбивка по низу колонтитула
const BAND_GREEN_H = BAND_H - BAND_RULE_H;
const BAND_TITLE_FS = 19;
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

/**
 * Оптическое центрирование текста в цветной плашке.
 *
 * При `lineHeight: 1` react-pdf сажает базовую линию почти на низ строчного бокса,
 * поэтому глиф оказывается НИЖЕ центра плашки на `0.164 × кегль` — и при
 * `justifyContent: "center"`, и при симметричных paddings. Компенсируем нижним
 * отступом: он увеличивает бокс снизу и поднимает глиф на половину своей величины,
 * отсюда множитель 2.
 *
 * Коэффициент выверен пиксельным замером рендера на кеглях 8 / 10.5 / 14
 * (смещение строго пропорционально кеглю). Работает только вместе с `lineHeight: 1`.
 */
const GLYPH_SINK_RATIO = 0.1638;
function opticalCenter(fontSize: number) {
  return { lineHeight: 1, marginBottom: 2 * GLYPH_SINK_RATIO * fontSize };
}

/**
 * То же для плашки, высота которой задана паддингами (жёлтые блоки сумм):
 * переносим `sink` сверху вниз. Высота плашки при этом не меняется — в отличие
 * от `opticalCenter`, поэтому вёрстка листа не едет.
 */
function platePadding(fontSize: number, pad: number) {
  const sink = GLYPH_SINK_RATIO * fontSize;
  return { paddingTop: pad - sink, paddingBottom: pad + sink };
}

/** `top` для абсолютной строки, чтобы она встала по центру полосы высотой `h`. */
function centerTextTop(h: number, fontSize: number) {
  return h / 2 - (fontSize / 2 + GLYPH_SINK_RATIO * fontSize);
}

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
  coverRule: { width: 96, height: 5, borderRadius: 2.5, backgroundColor: BRAND.yellow, marginBottom: 16 },
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
  // Центруем по зелёной части полосы (без жёлтой отбивки), а не по всей высоте.
  bandLogo: { position: "absolute", top: (BAND_GREEN_H - 20) / 2, left: 40, height: 20, width: 20 * WORDMARK_RATIO },
  bandTitle: {
    position: "absolute",
    top: centerTextTop(BAND_GREEN_H, BAND_TITLE_FS),
    left: 0,
    right: 40,
    textAlign: "right",
    color: BRAND.white,
    fontSize: BAND_TITLE_FS,
    fontWeight: 700,
    lineHeight: 1,
  },
  // Жёлтая отбивка колонтитула — сквозной акцент на каждом листе.
  bandRule: { position: "absolute", bottom: 0, left: 0, width: PAGE_W, height: BAND_RULE_H, backgroundColor: BRAND.yellow },

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
    // Подвал абсолютный: его зелёная черта начинается в 35pt от низа листа.
    // Отступ = 35 + воздух, иначе контент слипается с чертой.
    paddingBottom: 52,
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
  costHighlight: { backgroundColor: BRAND.yellow, alignSelf: "flex-start", ...platePadding(27, 9), paddingHorizontal: 12, borderRadius: 6, marginTop: 6, marginBottom: 8 },
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

  // Матрица «направления × месяцы».
  // Кегль ячеек строки обязан совпадать с соседними (`tHeadCell` — 9, `tTotalCell` — 10):
  // react-pdf не выравнивает ячейки строки ни по center, ни по baseline (проверено),
  // а разный кегль даёт разную высоту строчного бокса — и текст встаёт на разной высоте.
  mtxHeadCellCenter: { color: BRAND.white, fontSize: 9, fontWeight: 700, paddingVertical: 5, paddingHorizontal: 2, textAlign: "center" },
  // Маркер активного месяца рисуем View-кружком: в шрифте нет глифа «✓».
  mtxCell: { paddingVertical: 4, alignItems: "center", justifyContent: "center" },
  dotOn: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND.green },
  dotOff: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#D5D5D5" },
  mtxTermCell: { fontSize: 9.5, paddingVertical: 4, paddingHorizontal: 8, textAlign: "right" },
  // Сумма за срок — вспомогательная: тот же кегль (иначе строка «поедет»), но серым.
  tCellSub: { color: BRAND.gray },
  mtxTotalCellCenter: { fontSize: 10, fontWeight: 700, color: BRAND.ink, paddingVertical: 5, paddingHorizontal: 2, textAlign: "center" },

  badgeOn: { color: BRAND.greenDark, fontWeight: 700 },
  badgeOff: { color: BRAND.mute },
  muted: { color: BRAND.mute },

  // Плашка со статусом направления (на слайде-описании)
  // Срок — жёлтая плашка (акцент), «не входит» остаётся нейтрально-серой.
  // platePadding обязателен: иначе текст просядет ниже центра плашки.
  dirBadgeOn: { backgroundColor: BRAND.yellow, color: BRAND.ink, fontSize: 8, fontWeight: 700, lineHeight: 1, ...platePadding(8, 4), paddingHorizontal: 9, borderRadius: 8, textTransform: "uppercase" },
  dirBadgeOff: { backgroundColor: "#E7E7E7", color: BRAND.gray, fontSize: 8, fontWeight: 700, lineHeight: 1, ...platePadding(8, 4), paddingHorizontal: 9, borderRadius: 8, textTransform: "uppercase" },
  dirPriceStrike: { color: BRAND.gray, textDecoration: "line-through" },

  // О компании
  statsRow: { flexDirection: "row", marginBottom: 18, gap: 12 },
  stat: { flex: 1 },
  statNum: { fontSize: 26, fontWeight: 700, color: BRAND.green, lineHeight: 1, marginBottom: 6 },
  statBar: { width: 34, height: 4, borderRadius: 2, backgroundColor: BRAND.yellow, marginBottom: 6 },
  statLabel: { fontSize: 9, color: BRAND.gray, lineHeight: 1.2 },
  advRow: { flexDirection: "row", flexWrap: "wrap" },
  adv: { width: "50%", paddingRight: 16, marginBottom: 11, flexDirection: "row" },
  advDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: BRAND.green, marginTop: 4, marginRight: 8 },
  advTitle: { fontSize: 11, fontWeight: 700, color: BRAND.ink, marginBottom: 2 },
  advText: { fontSize: 9, color: BRAND.gray },

  contacts: { flexDirection: "row", justifyContent: "space-between", marginTop: 10, paddingTop: 12, borderTopWidth: 2, borderTopColor: BRAND.green },
  contactName: { fontSize: 12, fontWeight: 700, color: BRAND.ink },
  contactLine: { fontSize: 10, color: BRAND.gray },

  // ── Презентационные слайды (lib/pitch.ts) ──────────────────────────────────
  // Общие примитивы: заголовок-лид, абзац, список, «заметка», итоговая полоса.
  lead: { fontSize: 23, fontWeight: 700, color: BRAND.ink, lineHeight: 1.15, marginBottom: 11 },
  leadRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 11 },
  leadFlex: { flex: 1, paddingRight: 14 },
  para: { fontSize: 11, color: BRAND.gray, lineHeight: 1.5, marginBottom: 7 },
  paraInk: { color: BRAND.ink },
  // Длина строки на всю ширину A4 landscape нечитаема — вводные абзацы сужаем.
  paraNarrow: { maxWidth: "82%" },

  cols: { flexDirection: "row", gap: 22 },
  // Распорка: прижимает итоговую полосу к низу слайда (marginTop:"auto" в react-pdf ненадёжен).
  spacer: { flexGrow: 1, minHeight: 8 },

  li: { flexDirection: "row", marginBottom: 5 },
  liDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: BRAND.green, marginTop: 5.5, marginRight: 8 },
  liMark: { width: 10, marginTop: 3, marginRight: 7 },
  liText: { flex: 1, fontSize: 10.5, lineHeight: 1.4 },
  liTextMuted: { color: BRAND.gray },

  note: { borderLeftWidth: 2.5, borderLeftColor: BRAND.green, paddingLeft: 10, marginBottom: 11 },
  noteTitle: { fontSize: 11, fontWeight: 700, color: BRAND.ink, marginBottom: 3 },
  noteText: { fontSize: 10, color: BRAND.gray, lineHeight: 1.45 },

  strip: { backgroundColor: BRAND.greenTint, borderRadius: 10, padding: 14 },
  // Зелёная черта = заголовок раздела (subBar), жёлтая = вывод/итог.
  stripHead: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  stripBar: { width: 4, height: 11, borderRadius: 2, backgroundColor: BRAND.yellow, marginRight: 7 },
  stripLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: BRAND.greenDark, letterSpacing: 1 },
  stripText: { fontSize: 12, color: BRAND.ink, lineHeight: 1.45 },

  // Нумерация — жёлтая: #FFDE00 нечитаем как текст, но отличная подложка под тёмный.
  numCircle: { width: 20, height: 20, borderRadius: 10, backgroundColor: BRAND.yellow, alignItems: "center", justifyContent: "center", marginRight: 8 },
  numCircleText: { fontSize: 10.5, fontWeight: 700, color: BRAND.ink, ...opticalCenter(10.5) },

  // Слайд «Комплексное SEO 2.0»: карточки рыночных фактов + шаги подхода
  factRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  fact: { flex: 1, backgroundColor: BRAND.greenSoft, borderRadius: 10, padding: 14 },
  factValue: { fontSize: 27, fontWeight: 700, color: BRAND.green, lineHeight: 1, marginBottom: 8 },
  factText: { fontSize: 10, color: BRAND.gray, lineHeight: 1.4 },
  stepRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  step: { flex: 1, flexDirection: "row", alignItems: "flex-start" },
  stepText: { flex: 1, fontSize: 10.5, color: BRAND.ink, lineHeight: 1.35 },

  // Слайд «Экосистема»: сетка из 5 карточек
  ecoGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginBottom: 8 },
  ecoCell: { width: "33.333%", paddingHorizontal: 6, paddingBottom: 12 },
  ecoCard: { backgroundColor: BRAND.greenSoft, borderRadius: 10, padding: 14, flexGrow: 1 },
  ecoHead: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  ecoTitle: { flex: 1, fontSize: 12.5, fontWeight: 700, color: BRAND.ink, lineHeight: 1.2 },
  ecoText: { fontSize: 10, color: BRAND.gray, lineHeight: 1.45 },

  // Слайд «Путь клиента»: горизонтальный таймлайн из 5 этапов
  stagesRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  stage: { flex: 1 },
  stageTop: { flexDirection: "row", alignItems: "center", marginBottom: 9 },
  stageLine: { flex: 1, height: 2, backgroundColor: BRAND.greenTint, marginLeft: 4 },
  stageQuote: { fontSize: 12.5, fontWeight: 700, color: BRAND.ink, lineHeight: 1.2, marginBottom: 5 },
  stageDir: { fontSize: 8.5, fontWeight: 700, color: BRAND.greenDark, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 7 },
  stageText: { fontSize: 10, color: BRAND.gray, lineHeight: 1.45 },

  // Группы пунктов (инструменты, метрики отчётности)
  groupRow: { flexDirection: "row", gap: 14, marginBottom: 10 },
  group: { flex: 1 },
  groupTitle: { fontSize: 10.5, fontWeight: 700, color: BRAND.white, backgroundColor: BRAND.green, borderRadius: 5, paddingVertical: 5, paddingHorizontal: 9, marginBottom: 9 },

  // Слайд «Команда»: карточки ролей
  roleGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6, marginBottom: 8 },
  roleCell: { width: "33.333%", paddingHorizontal: 6, paddingBottom: 10 },
  roleCard: { backgroundColor: BRAND.light, borderRadius: 8, paddingVertical: 10, paddingHorizontal: 12, flexGrow: 1 },
  roleName: { fontSize: 11.5, fontWeight: 700, color: BRAND.ink },
  roleNote: { fontSize: 9.5, color: BRAND.gray, marginTop: 3 },

  // Слайд состава работ: баннер «сумма · срок · объём» + карточки работ
  // Плотность выверена так, чтобы самое длинное направление каталога (11 работ,
  // 6 рядов сетки) укладывалось в один лист. Правки размеров тут — проверять рендером.
  dirGoalLead: { fontSize: 11, color: BRAND.gray, lineHeight: 1.3, marginBottom: 6 },
  dirCost: { flexDirection: "row", backgroundColor: BRAND.greenTint, borderRadius: 12, padding: 11, gap: 18, marginBottom: 8 },
  dirCostMain: { width: "36%" },
  dirCostCell: { flex: 1, borderLeftWidth: 1, borderLeftColor: "#CFE6C7", paddingLeft: 16 },
  dirCostLabel: { fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", color: BRAND.greenDark, letterSpacing: 0.8, marginBottom: 6 },
  dirCostSum: { backgroundColor: BRAND.yellow, alignSelf: "flex-start", ...platePadding(18, 8), paddingHorizontal: 11, borderRadius: 6 },
  dirCostSumText: { fontSize: 18, fontWeight: 700, color: BRAND.ink, lineHeight: 1 },
  dirCostValue: { fontSize: 15, fontWeight: 700, color: BRAND.ink, lineHeight: 1.15 },
  dirCostSub: { fontSize: 8.5, color: BRAND.gray, marginTop: 5 },
  dirCostNote: { fontSize: 8.5, color: BRAND.gray, marginTop: 6 },
  monthDots: { flexDirection: "row", gap: 4, marginTop: 8 },
  monthDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C6E0BC" },
  monthDotOn: { backgroundColor: BRAND.green },

  workGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  workCell: { width: "50%", paddingHorizontal: 5, paddingBottom: 4 },
  workCard: { backgroundColor: BRAND.light, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 11, flexGrow: 1 },
  workHead: { fontSize: 9.5, fontWeight: 700, color: BRAND.ink, lineHeight: 1.2 },
  workDesc: { fontSize: 8.5, color: BRAND.gray, lineHeight: 1.3, marginTop: 1.5 },

  // Слайд «Клиенты»: крупная цифра на жёлтом — единственный «геройский» акцент слайда
  nichesCard: { backgroundColor: BRAND.yellow, borderRadius: 12, paddingHorizontal: 18, paddingBottom: 18, paddingTop: 18 - GLYPH_SINK_RATIO * 48, marginBottom: 14, alignSelf: "flex-start" },
  nichesValue: { fontSize: 48, fontWeight: 700, color: BRAND.ink, lineHeight: 1, marginBottom: 7 },
  nichesLabel: { fontSize: 11, color: BRAND.ink, fontWeight: 700 },
  photoWrap: { borderRadius: 12, overflow: "hidden" },
  photo: { width: "100%", height: 330, objectFit: "cover" },
});

// PT Sans не содержит ряд символов (стрелки) — заменяем на тире.
function clean(str: string): string {
  return str.replace(/[→←↔]/g, "—");
}

/** Презентационные описания по ключу направления (может не быть для новых ключей). */
const pitchByKey = Object.fromEntries(PITCH_DIRECTIONS.map((p) => [p.key, p])) as Partial<
  Record<Proposal["directions"][number]["key"], (typeof PITCH_DIRECTIONS)[number]>
>;

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
      {/* Поверх watermark, иначе он приглушит цвет. */}
      <View style={s.bandRule} />
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

// ── Примитивы презентационных слайдов ────────────────────────────────────────

/** Крупный заголовок-лид слайда; `badge` — необязательная плашка справа. */
function Lead({ text, badge }: { text: string; badge?: React.ReactNode }) {
  if (!badge) return <Text style={s.lead}>{clean(text)}</Text>;
  return (
    <View style={s.leadRow}>
      <Text style={[s.lead, s.leadFlex, { marginBottom: 0 }]}>{clean(text)}</Text>
      {badge}
    </View>
  );
}

/** Абзацы вводного текста. `narrow` — ограничить длину строки на всю ширину слайда. */
function Paras({
  items,
  ink,
  narrow,
}: {
  items: readonly string[];
  ink?: boolean;
  narrow?: boolean;
}) {
  return (
    <>
      {items.map((t, i) => (
        <Text key={i} style={[s.para, ink ? s.paraInk : {}, narrow ? s.paraNarrow : {}]}>
          {clean(t)}
        </Text>
      ))}
    </>
  );
}

/** В шрифте нет глифов «✓»/«✗» — рисуем их вектором. */
function CheckIcon() {
  return (
    <Svg width={10} height={10} style={s.liMark}>
      <Path d="M1 5 L4 8 L9 1.5" stroke={BRAND.green} strokeWidth={1.8} fill="none" />
    </Svg>
  );
}

function CrossIcon() {
  return (
    <Svg width={10} height={10} style={s.liMark}>
      <Path d="M1.5 1.5 L8.5 8.5" stroke={BRAND.mute} strokeWidth={1.6} fill="none" />
      <Path d="M8.5 1.5 L1.5 8.5" stroke={BRAND.mute} strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

/** Список пунктов. `marker`: точка (по умолчанию), галочка или крестик. */
function Bullets({
  items,
  marker = "dot",
  muted,
}: {
  items: readonly string[];
  marker?: "dot" | "check" | "cross";
  muted?: boolean;
}) {
  return (
    <>
      {items.map((t, i) => (
        <View key={i} style={s.li}>
          {marker === "dot" && <View style={s.liDot} />}
          {marker === "check" && <CheckIcon />}
          {marker === "cross" && <CrossIcon />}
          <Text style={[s.liText, muted ? s.liTextMuted : {}]}>{clean(t)}</Text>
        </View>
      ))}
    </>
  );
}

/** Блок «Почему это важно» / «Ваша выгода»: заголовок + абзац с зелёной чертой. */
function Notes({ items }: { items: readonly PitchNote[] }) {
  return (
    <>
      {items.map((n) => (
        <View key={n.title} style={s.note}>
          <Text style={s.noteTitle}>{n.title}</Text>
          <Text style={s.noteText}>{clean(n.text)}</Text>
        </View>
      ))}
    </>
  );
}

/** Итоговая зелёная полоса слайда («Результат», «Ваша выгода», …). */
function ResultStrip({ label, text }: { label: string; text: string }) {
  return (
    <View style={s.strip} wrap={false}>
      <View style={s.stripHead}>
        <View style={s.stripBar} />
        <Text style={s.stripLabel}>{label}</Text>
      </View>
      <Text style={s.stripText}>{clean(text)}</Text>
    </View>
  );
}

function NumCircle({ n }: { n: number }) {
  return (
    <View style={s.numCircle}>
      <Text style={s.numCircleText}>{n}</Text>
    </View>
  );
}

/** Именованная группа пунктов (инструменты, метрики). */
function Group({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <View style={s.group}>
      <Text style={s.groupTitle}>{title}</Text>
      <Bullets items={items} />
    </View>
  );
}

/**
 * Плашка со статусом направления в этом КП — связывает презентационный слайд
 * со сметой («все 6 месяцев» / «мес. 1–3» / «не входит»).
 */
function DirectionBadge({ calc }: { calc?: DirectionScheduleCalc }) {
  const included = (calc?.activeMonths.length ?? 0) > 0;
  return (
    <Text style={included ? s.dirBadgeOn : s.dirBadgeOff}>
      {included ? calc!.monthsLabel : "не входит"}
    </Text>
  );
}

/**
 * Пункт работ в каталоге имеет вид «Заголовок — описание» — разделяем, чтобы
 * заголовок читался жирным. У произвольных (custom) работ тире может не быть.
 */
function splitWork(text: string): { head: string; rest: string } {
  const i = text.indexOf(" — ");
  if (i === -1) return { head: text, rest: "" };
  return { head: text.slice(0, i), rest: text.slice(i + 3) };
}

/** Слайд состава работ направления: акцент на сумме и сроке + карточки работ. */
function WorksSlide({
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
  // Экономия считается по месяцам поэлементно: если направление активно и в
  // месяцы со скидкой, и без неё, разница минимумов дала бы неверную величину.
  const discountPerMonth = calc.fullPricePerMonth.map(
    (full, i) => full - calc.pricePerMonth[i],
  );

  return (
    <Page size="A4" orientation="landscape" style={s.page} wrap>
      <HeaderBand title={direction.name} />

      <Text style={s.dirGoalLead}>{clean(direction.goal)}</Text>

      <View style={s.dirCost} wrap={false}>
        <View style={s.dirCostMain}>
          <Text style={s.dirCostLabel}>Стоимость в месяц</Text>
          <View style={s.dirCostSum}>
            <Text style={s.dirCostSumText}>
              {formatMonthlyMoney(calc.pricePerMonth)}
            </Text>
          </View>
          {discounted && (
            <Text style={s.dirCostNote}>
              без скидки{" "}
              <Text style={s.dirPriceStrike}>
                {formatMonthlyMoney(calc.fullPricePerMonth)}
              </Text>
              {" · экономия "}
              <Text style={{ color: BRAND.greenDark, fontWeight: 700 }}>
                {formatMonthlyMoney(discountPerMonth)}
              </Text>
            </Text>
          )}
        </View>

        <View style={s.dirCostCell}>
          <Text style={s.dirCostLabel}>Период работ</Text>
          <Text style={s.dirCostValue}>{calc.monthsLabel}</Text>
          <View style={s.monthDots}>
            {months.map((m) => (
              <View
                key={m}
                style={[s.monthDot, active.has(m) ? s.monthDotOn : {}]}
              />
            ))}
          </View>
          <Text style={s.dirCostSub}>за срок — {formatMoney(calc.totalPrice)}</Text>
        </View>

        <View style={s.dirCostCell}>
          <Text style={s.dirCostLabel}>Объём работ</Text>
          <Text style={s.dirCostValue}>
            {formatMonthlyHours(calc.hoursPerMonth)} в месяц
          </Text>
          <Text style={s.dirCostSub}>
            {direction.works.length} видов работ · {formatHours(calc.totalHours)} за
            срок
          </Text>
        </View>
      </View>

      <SubHead title="Состав работ" />
      <View style={s.workGrid}>
        {direction.works.map((w, i) => {
          const { head, rest } = splitWork(w.text);
          return (
            <View key={i} style={s.workCell} wrap={false}>
              <View style={s.workCard}>
                <Text style={s.workHead}>{clean(head)}</Text>
                {rest !== "" && <Text style={s.workDesc}>{clean(rest)}</Text>}
              </View>
            </View>
          );
        })}
      </View>

      <Footer />
    </Page>
  );
}

/** Каркас слайда: колонтитул, контент, прижатая к низу полоса и подвал. */
function Slide({
  title,
  children,
  strip,
}: {
  title: string;
  children: React.ReactNode;
  strip?: { label: string; text: string };
}) {
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <HeaderBand title={title} />
      {children}
      {strip && (
        <>
          <View style={s.spacer} />
          <ResultStrip label={strip.label} text={strip.text} />
        </>
      )}
      <Footer />
    </Page>
  );
}

export function ProposalDocument({ proposal }: { proposal: Proposal }) {
  const { input, directions, meta } = proposal;
  // Считаем по снимку настроек этого КП: правка коэффициентов в «Настройках»
  // не должна менять цифры уже отправленного клиенту предложения.
  const calc = calculateSchedule(
    input,
    directions,
    mergeCalcConfig(proposal.calcConfig),
  );
  // Менеджер КП; у старых КП его нет — показываем контакт по умолчанию.
  const manager = proposal.manager?.name ? proposal.manager : COMPANY.manager;
  const calcByKey = Object.fromEntries(calc.perDirection.map((d) => [d.key, d]));
  const term = pluralMonths(calc.durationMonths);
  const clientLabel = meta?.clientName || input.siteName;

  // Геометрия матрицы «направления × месяцы».
  const nMonths = calc.durationMonths;
  const monthNums = calc.months.map((m) => m.month);
  const nameW = "30%";
  const perMonthW = "16%";
  const termW = "16%";
  const monthW = `${38 / nMonths}%`;

  // Помесячные величины проекта. Считаем по месяцам, где есть работы: месяц без
  // единого активного направления не должен занижать «платёж в месяц» до нуля.
  const paidMonths = calc.months.filter((m) => m.monthlyTotalPrice > 0);
  const monthlyPrices = paidMonths.map((m) => m.monthlyTotalPrice);
  const monthlyFullPrices = paidMonths.map((m) => m.monthlyTotalFullPrice);
  const monthlyDiscounts = paidMonths.map((m) => m.monthlyDiscount);
  const monthlyHours = paidMonths.map((m) => m.monthlyTotalHours);
  // Если набор направлений одинаков во все месяцы, «без скидки» и «экономию»
  // можно дать помесячно. Когда месяцы разные, минимумы по строкам пришли бы из
  // разных месяцев и не сходились бы между собой — тогда экономию считаем за срок.
  const sameEveryMonth =
    new Set(monthlyPrices).size <= 1 && new Set(monthlyFullPrices).size <= 1;

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
          <View style={s.coverRule} />
          <Text style={s.coverSubtitle}>
            Предложение для компании{" "}
            <Text style={{ fontWeight: 700 }}>{clientLabel}</Text>
          </Text>
        </View>

        <View style={s.coverContacts}>
          <Text style={s.coverPrepared}>Подготовил:</Text>
          <Text style={s.coverPreparedName}>{manager.name}</Text>
          {!!manager.role && (
            <Text style={s.coverContactLine}>{manager.role}</Text>
          )}
          {!!manager.phone && (
            <Text style={[s.coverContactLine, { marginTop: 8 }]}>
              {manager.phone}
            </Text>
          )}
          {!!manager.email && (
            <Text style={s.coverContactLine}>{manager.email}</Text>
          )}
          <Text style={s.coverSite}>{COMPANY.site}</Text>
        </View>
      </Page>

      {/* ── Подход: почему SEO больше не сводится к позициям ── */}
      <Slide
        title="Комплексное SEO 2.0"
        strip={{ label: "Главное", text: PITCH_COMPLEX.closing }}
      >
        <Lead text={PITCH_COMPLEX.lead} />
        <Paras items={[PITCH_COMPLEX.intro]} narrow />

        <SubHead title={PITCH_COMPLEX.marketTitle} />
        <View style={s.factRow}>
          {PITCH_COMPLEX.market.map((f) => (
            <View key={f.value} style={s.fact}>
              <Text style={s.factValue}>{f.value}</Text>
              <Text style={s.factText}>{f.text}</Text>
            </View>
          ))}
        </View>

        <SubHead title={PITCH_COMPLEX.approachTitle} />
        <Text style={s.para}>{PITCH_COMPLEX.approachLead}</Text>
        <View style={s.stepRow}>
          {PITCH_COMPLEX.approach.map((t, i) => (
            <View key={t} style={s.step}>
              <NumCircle n={i + 1} />
              <Text style={s.stepText}>{clean(t)}</Text>
            </View>
          ))}
        </View>
      </Slide>

      {/* ── Почему обычное SEO уже не работает ── */}
      <Slide
        title="Почему обычное SEO не работает"
        strip={{ label: PITCH_OLD_SEO.answerTitle, text: PITCH_OLD_SEO.answer }}
      >
        <Lead text={PITCH_OLD_SEO.lead} />
        <View style={s.cols}>
          <View style={{ flex: 1 }}>
            <Paras items={PITCH_OLD_SEO.intro} />
            <SubHead title={PITCH_OLD_SEO.consequencesTitle} />
            <Bullets items={PITCH_OLD_SEO.consequences} />
          </View>
          <View style={{ flex: 1 }}>
            <SubHead title={PITCH_OLD_SEO.failsTitle} />
            <Bullets items={PITCH_OLD_SEO.fails} marker="cross" muted />
          </View>
        </View>
      </Slide>

      {/* ── Экосистема из 5 типов SEO ── */}
      <Slide
        title="Экосистема из 5 типов SEO"
        strip={{ label: PITCH_ECOSYSTEM.resultTitle, text: PITCH_ECOSYSTEM.result }}
      >
        <Lead text={PITCH_ECOSYSTEM.lead} />
        <Paras items={[PITCH_ECOSYSTEM.intro]} narrow />
        <View style={s.ecoGrid}>
          {PITCH_ECOSYSTEM.items.map((it, i) => (
            <View key={it.title} style={s.ecoCell}>
              <View style={s.ecoCard}>
                <View style={s.ecoHead}>
                  <NumCircle n={i + 1} />
                  <Text style={s.ecoTitle}>{it.title}</Text>
                </View>
                <Text style={s.ecoText}>{clean(it.text)}</Text>
              </View>
            </View>
          ))}
        </View>
      </Slide>

      {/* ── Путь клиента: как 5 направлений работают вместе ── */}
      <Slide
        title="Путь клиента"
        strip={{ label: PITCH_JOURNEY.valueTitle, text: PITCH_JOURNEY.value }}
      >
        <Lead text={PITCH_JOURNEY.lead} />
        <Paras items={[PITCH_JOURNEY.intro]} narrow />
        <View style={s.stagesRow}>
          {PITCH_JOURNEY.stages.map((st, i) => (
            <View key={st.quote} style={s.stage}>
              <View style={s.stageTop}>
                <NumCircle n={i + 1} />
                <View style={s.stageLine} />
              </View>
              <Text style={s.stageQuote}>«{st.quote}»</Text>
              <Text style={s.stageDir}>{st.direction}</Text>
              <Text style={s.stageText}>{clean(st.text)}</Text>
            </View>
          ))}
        </View>
      </Slide>

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
            {/* Акцент — платёж за один месяц: сумма за весь срок пугает клиента
                и остаётся справочной строкой внизу карточки. */}
            <SubHead title="Стоимость" />
            <View style={s.costCard}>
              <Text style={s.costCardLabel}>Платёж в месяц</Text>
              <View style={s.costHighlight}>
                <Text style={s.costHighlightText}>
                  {formatMonthlyMoney(monthlyPrices)}
                </Text>
              </View>
              {calc.totalDiscount > 0 && (
                <>
                  {sameEveryMonth && (
                    <View style={s.costLine}>
                      <Text style={s.costLineLabel}>Без скидки в месяц</Text>
                      <Text style={[s.costLineValue, s.dirPriceStrike]}>
                        {formatMoney(monthlyFullPrices[0])}
                      </Text>
                    </View>
                  )}
                  <View style={s.costLine}>
                    <Text style={s.costLineLabel}>
                      {sameEveryMonth ? "Экономия в месяц" : `Экономия за ${term}`}{" "}
                      (пакетная скидка)
                    </Text>
                    <Text style={[s.costLineValue, { color: BRAND.greenDark }]}>
                      {formatMoney(
                        sameEveryMonth ? monthlyDiscounts[0] : calc.totalDiscount,
                      )}
                    </Text>
                  </View>
                </>
              )}
              <View style={s.costDivider} />
              <View style={s.costLine}>
                <Text style={s.costLineLabel}>Часов в месяц</Text>
                <Text style={s.costLineValue}>
                  {formatMonthlyHours(monthlyHours)}
                </Text>
              </View>
              <View style={s.costLine}>
                <Text style={s.costLineLabel}>Срок продвижения</Text>
                <Text style={s.costLineValue}>{term}</Text>
              </View>
              <View style={s.costLine}>
                <Text style={s.costLineLabel}>Итого за {term}</Text>
                <Text style={s.costLineValue}>{formatMoney(calc.totalPrice)}</Text>
              </View>
            </View>
          </View>
        </View>

        <SubHead title="Состав по месяцам" />
        <View style={s.tHead}>
          <Text style={[s.tHeadCell, { width: nameW }]}>Направление</Text>
          <Text style={[s.tHeadCell, s.cPrice, { width: perMonthW }]}>
            В месяц, {calc.currency}
          </Text>
          {monthNums.map((m) => (
            <Text key={m} style={[s.mtxHeadCellCenter, { width: monthW }]}>
              {m}
            </Text>
          ))}
          <Text style={[s.tHeadCell, s.cPrice, { width: termW }]}>
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
              {/* Цена месяца — главная цифра строки; сумма за срок рядом, но серым. */}
              <Text
                style={[
                  s.mtxTermCell,
                  { width: perMonthW },
                  included ? {} : s.muted,
                  included && discounted ? { color: BRAND.greenDark } : {},
                ]}
              >
                {included ? formatMonthlyAmount(d.pricePerMonth) : "—"}
              </Text>
              {monthNums.map((m) => (
                <View key={m} style={[s.mtxCell, { width: monthW }]}>
                  <View style={active.has(m) ? s.dotOn : s.dotOff} />
                </View>
              ))}
              <Text
                style={[s.mtxTermCell, { width: termW }, included ? s.tCellSub : s.muted]}
              >
                {included ? formatAmount(d.totalPrice) : "—"}
              </Text>
            </View>
          );
        })}
        <View style={s.tTotal} wrap={false}>
          <Text style={[s.tTotalCell, { width: nameW }]}>
            Итого, {calc.currency}
          </Text>
          <Text style={[s.tTotalCell, s.cPrice, { width: perMonthW }]}>
            {formatMonthlyAmount(monthlyPrices)}
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
            {formatAmount(calc.totalPrice)}
          </Text>
        </View>

        <Footer />
      </Page>

      {/*
        ── Направления: по два слайда на каждое ──
        (1) презентационное описание, (2) состав работ из сметы с акцентом на
        сумме и сроке. Второй слайд опускаем для направлений вне предложения —
        показывать состав работ, который клиент не покупает, незачем.
      */}
      {directions.flatMap((d) => {
        const c = calcByKey[d.key];
        const p = pitchByKey[d.key];
        const pages: React.ReactNode[] = [];

        if (p) {
          const half = Math.ceil(p.does.length / 2);
          pages.push(
            <Slide
              key={`${d.key}-about`}
              title={d.name}
              strip={{ label: p.resultTitle, text: p.result }}
            >
              <Lead text={p.lead} badge={<DirectionBadge calc={c} />} />
              <View style={s.cols}>
                <View style={{ width: "42%" }}>
                  <Paras items={p.intro} />
                  <View style={{ height: 4 }} />
                  <Notes items={p.notes} />
                </View>
                <View style={{ flex: 1 }}>
                  <SubHead title={p.doTitle} />
                  {p.does.length > 9 ? (
                    <View style={{ flexDirection: "row", gap: 16 }}>
                      <View style={{ flex: 1 }}>
                        <Bullets items={p.does.slice(0, half)} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Bullets items={p.does.slice(half)} />
                      </View>
                    </View>
                  ) : (
                    <Bullets items={p.does} />
                  )}
                </View>
              </View>
            </Slide>,
          );
        }

        if (c.activeMonths.length > 0) {
          pages.push(
            <WorksSlide
              key={`${d.key}-works`}
              direction={d}
              calc={c}
              durationMonths={calc.durationMonths}
            />,
          );
        }
        return pages;
      })}

      {/* ── Команда Qmedia ── */}
      <Slide
        title="Команда Qmedia"
        strip={{ label: PITCH_TEAM.resultTitle, text: PITCH_TEAM.result }}
      >
        <Lead text={PITCH_TEAM.lead} />
        <Paras items={PITCH_TEAM.intro} narrow />
        <SubHead title={PITCH_TEAM.rolesTitle} />
        <View style={s.roleGrid}>
          {PITCH_TEAM.roles.map((r) => (
            <View key={r.role} style={s.roleCell}>
              <View style={s.roleCard}>
                <Text style={s.roleName}>{r.role}</Text>
                {r.note !== "" && <Text style={s.roleNote}>{r.note}</Text>}
              </View>
            </View>
          ))}
        </View>
        <View style={s.cols}>
          {PITCH_TEAM.notes.map((n) => (
            <View key={n.title} style={{ flex: 1 }}>
              <Notes items={[n]} />
            </View>
          ))}
        </View>
      </Slide>

      {/* ── Project-менеджер ── */}
      <Slide
        title="Project-менеджер"
        strip={{ label: PITCH_PM.resultTitle, text: PITCH_PM.result }}
      >
        <Lead text={PITCH_PM.lead} />
        <View style={s.cols}>
          <View style={{ width: "42%" }}>
            <Paras items={PITCH_PM.intro} />
            <View style={{ height: 4 }} />
            <Notes items={PITCH_PM.notes} />
          </View>
          <View style={{ flex: 1 }}>
            <SubHead title={PITCH_PM.doTitle} />
            <Bullets items={PITCH_PM.does} />
          </View>
        </View>
      </Slide>

      {/* ── Инструменты и технологии ── */}
      <Slide
        title="Инструменты и технологии"
        strip={{ label: PITCH_TOOLS.resultTitle, text: PITCH_TOOLS.result }}
      >
        <Lead text={PITCH_TOOLS.lead} />
        <Paras items={PITCH_TOOLS.intro} narrow />
        <SubHead title={PITCH_TOOLS.groupsTitle} />
        <View style={s.groupRow}>
          {PITCH_TOOLS.groups.map((g) => (
            <Group key={g.title} title={g.title} items={g.items} />
          ))}
        </View>
      </Slide>

      {/* ── Аналитика и отчётность ── */}
      <Slide title="Аналитика и отчётность">
        <Lead text={PITCH_ANALYTICS.lead} />
        <Paras items={PITCH_ANALYTICS.intro} narrow />
        <SubHead title={PITCH_ANALYTICS.groupsTitle} />
        <View style={s.groupRow}>
          {PITCH_ANALYTICS.groups.map((g) => (
            <Group key={g.title} title={g.title} items={g.items} />
          ))}
        </View>
        <View style={s.spacer} />
        <View style={s.strip} wrap={false}>
          <View style={s.stripHead}>
            <View style={s.stripBar} />
            <Text style={s.stripLabel}>{PITCH_ANALYTICS.reportTitle}</Text>
          </View>
          <Text style={[s.stripText, { marginBottom: 7 }]}>
            {PITCH_ANALYTICS.reportLead}
          </Text>
          {/* Три колонки по два пункта: в две колонки строка лишняя и лист рвётся. */}
          <View style={{ flexDirection: "row", gap: 16 }}>
            {[0, 2, 4].map((from) => (
              <View key={from} style={{ flex: 1 }}>
                <Bullets items={PITCH_ANALYTICS.report.slice(from, from + 2)} />
              </View>
            ))}
          </View>
        </View>
      </Slide>

      {/* ── Гарантии ── */}
      <Slide
        title="Гарантии Qmedia"
        strip={{ label: PITCH_GUARANTEES.resultTitle, text: PITCH_GUARANTEES.result }}
      >
        <Lead text={PITCH_GUARANTEES.lead} />
        <Paras items={PITCH_GUARANTEES.intro} narrow />
        <View style={s.cols}>
          <View style={{ flex: 1 }}>
            <SubHead title={PITCH_GUARANTEES.doTitle} />
            <Bullets items={PITCH_GUARANTEES.does} marker="check" />
          </View>
          <View style={{ flex: 1 }}>
            <SubHead title={PITCH_GUARANTEES.dontTitle} />
            <Bullets items={PITCH_GUARANTEES.donts} marker="cross" muted />
            <View style={{ height: 8 }} />
            <Notes items={PITCH_GUARANTEES.notes} />
          </View>
        </View>
      </Slide>

      {/* ── Клиенты и результаты ── */}
      <Slide title="Клиенты и результаты">
        <Lead text={PITCH_CLIENTS.lead} />
        <View style={s.cols}>
          <View style={{ flex: 1 }}>
            <View style={s.nichesCard}>
              <Text style={s.nichesValue}>{PITCH_CLIENTS.nichesValue}</Text>
              <Text style={s.nichesLabel}>{PITCH_CLIENTS.nichesLabel}</Text>
            </View>
            <SubHead title={PITCH_CLIENTS.pointsTitle} />
            <Text style={s.para}>{PITCH_CLIENTS.pointsLead}</Text>
            <Bullets items={PITCH_CLIENTS.points} />
          </View>
          <View style={{ width: "38%" }}>
            <View style={s.photoWrap}>
              <Image src={CLIENTS_PHOTO} style={s.photo} />
            </View>
          </View>
        </View>
      </Slide>

      {/* ── Почему Qmedia + контакты ── */}
      <Page size="A4" orientation="landscape" style={s.page} wrap>
        <HeaderBand title={`Почему ${COMPANY.name}`} />

        <Lead text={PITCH_WHY.lead} />
        <Paras items={[PITCH_WHY.intro]} narrow />

        <View style={s.statsRow}>
          <View style={s.stat}>
            <Text style={s.statNum}>{COMPANY.foundedYear}</Text>
            <View style={s.statBar} />
            <Text style={s.statLabel}>год основания</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{COMPANY.clients}</Text>
            <View style={s.statBar} />
            <Text style={s.statLabel}>клиентов</Text>
          </View>
          <View style={s.stat}>
            <Text style={s.statNum}>{COMPANY.employees}</Text>
            <View style={s.statBar} />
            <Text style={s.statLabel}>специалистов в команде</Text>
          </View>
        </View>

        <SubHead title="Наши преимущества" />
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

        <Text style={[s.para, s.paraInk]}>{clean(PITCH_WHY.closing)}</Text>

        <View style={s.spacer} />

        <View style={s.contacts} wrap={false}>
          <View>
            <Text style={s.contactName}>{manager.name}</Text>
            {!!manager.role && <Text style={s.contactLine}>{manager.role}</Text>}
          </View>
          <View>
            {!!manager.phone && (
              <Text style={s.contactLine}>{manager.phone}</Text>
            )}
            {!!manager.email && (
              <Text style={s.contactLine}>{manager.email}</Text>
            )}
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
