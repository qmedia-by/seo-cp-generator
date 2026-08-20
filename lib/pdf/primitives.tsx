// Общие элементы слайдов PDF: каркас листа, подвал, водяные знаки, заголовки,
// списки, плашки. Всё, что повторяется больше чем на одном слайде.
//
// Геометрия и палитра — из `theme.ts` (координаты перенесены из макета 1:1).

import React from "react";
import {
  Defs,
  Image,
  LinearGradient,
  Link,
  Page,
  Path,
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { COMPANY } from "../company";
import { LOGO, ICON, Q_MARK } from "./assets";
import {
  centerTextTop,
  clean,
  DECK,
  type Sx,
  FONT,
  FOOTER_H,
  GREEN_WATERMARK_OPACITY,
  PAD_BOTTOM,
  PAD_TOP,
  PAD_X,
  PAGE_H,
  PAGE_SIZE,
  PAGE_W,
  PLATE_INSET_RATIO,
  PLATE_SPACE_RATIO,
  R,
  WORDMARK_RATIO,
  platePadding,
  plateText,
} from "./theme";

const s = StyleSheet.create({
  page: {
    fontFamily: FONT,
    color: DECK.ink,
    fontSize: 11,
    lineHeight: 1.35,
    paddingTop: PAD_TOP,
    paddingHorizontal: PAD_X,
    paddingBottom: PAD_BOTTOM,
    backgroundColor: DECK.white,
  },

  // --- Подвал ---
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: PAGE_W,
    height: FOOTER_H,
    overflow: "hidden",
  },
  footerLogo: {
    position: "absolute",
    top: 11,
    left: 30.5,
    height: 28,
    width: 28 * WORDMARK_RATIO,
  },
  // Кегль контактов в макете 8/9 pt; подняли до 9.5 и осветлили цвет —
  // на зелёном фоне прежний `note` заказчик назвал «слишком тусклым».
  footerPhone: {
    position: "absolute",
    top: centerTextTop(FOOTER_H, 9.5),
    left: 133.5,
    fontSize: 9.5,
    lineHeight: 1,
    color: DECK.footerText,
    textDecoration: "none",
  },
  footerMail: {
    position: "absolute",
    top: centerTextTop(FOOTER_H, 9.5),
    left: 245,
    fontSize: 9.5,
    lineHeight: 1,
    color: DECK.footerText,
    textDecoration: "none",
  },

  // --- Водяные знаки ---
  bleed: {
    position: "absolute",
    top: 0,
    left: 0,
    width: PAGE_W,
    height: PAGE_H,
    overflow: "hidden",
  },

  // --- Заголовок слайда ---
  // Только цвет и начертание: вертикальную геометрию строки задаёт `plateText`
  // (см. `HlLine`), чтобы жёлтая плашка сидела симметрично вокруг букв.
  h1: { fontWeight: 700, color: DECK.black },
  subLine: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    marginBottom: 10,
  },
  subText: { fontSize: 16, fontWeight: 700, color: DECK.black, lineHeight: 1 },

  // --- Подзаголовок внутри слайда ---
  kicker: { fontSize: 11, fontWeight: 700, color: DECK.ink, marginBottom: 6 },

  // --- Список ---
  li: { flexDirection: "row", marginBottom: 5 },
  liDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: DECK.bullet,
    marginTop: 4,
    marginRight: 8,
  },
  liText: { flex: 1 },

  // --- Плашка-заметка ---
  note: {
    backgroundColor: DECK.note,
    borderRadius: R.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },

  // --- Аватар ---
  avatarRing: { backgroundColor: DECK.yellow, alignItems: "center", justifyContent: "center" },
  avatarInner: {
    overflow: "hidden",
    backgroundColor: DECK.fact,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontWeight: 700, color: DECK.greenDeep },

  // --- Кнопка-таблетка ---
  pill: {
    alignSelf: "flex-start",
    backgroundColor: DECK.yellow,
    borderRadius: R.pill,
    paddingHorizontal: 16,
  },
  pillText: { fontWeight: 700, color: DECK.black, lineHeight: 1 },
  pillGhost: { backgroundColor: DECK.white, borderWidth: 1, borderColor: DECK.line },

  // --- Зелёный лист-разделитель ---
  greenPage: { fontFamily: FONT, color: DECK.white, position: "relative" },
  greenCenter: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: FOOTER_H,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 100,
  },
  greenTitleWrap: {
    backgroundColor: DECK.yellow,
    borderRadius: R.sm,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  greenTitle: {
    fontSize: 44,
    fontWeight: 700,
    color: DECK.black,
    lineHeight: 1,
    textAlign: "center",
  },
  greenSubWrap: { marginTop: 18, alignItems: "center" },
  greenSub: {
    fontSize: 21,
    fontWeight: 700,
    color: DECK.white,
    textAlign: "center",
    lineHeight: 1.3,
  },
});

// ── Подвал ───────────────────────────────────────────────────────────────────

/**
 * Зелёная полоса подвала: градиент 45° (accent1 → accent5), белый вордмарк и
 * кликабельные телефон/почта. `fixed` — чтобы повторялась, если лист разорвёт.
 */
export function FooterBand() {
  return (
    <View style={s.footer} fixed>
      <Svg
        width={PAGE_W}
        height={FOOTER_H}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <Defs>
          <LinearGradient id="footerBand" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={DECK.green} />
            <Stop offset="1" stopColor={DECK.greenDeep} />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={PAGE_W}
          height={FOOTER_H}
          fill="url(#footerBand)"
        />
      </Svg>
      <Image src={LOGO.wordmarkWhite} style={s.footerLogo} />
      <Link src={COMPANY.phoneHref} style={s.footerPhone}>
        {COMPANY.phone}
      </Link>
      <Link src={`mailto:${COMPANY.email}`} style={s.footerMail}>
        {COMPANY.email}
      </Link>
    </View>
  );
}

// ── Водяные знаки ────────────────────────────────────────────────────────────

/**
 * Знак «Q» вектором — водяные знаки листов.
 *
 * Раньше это была картинка; на 559 pt отрисовки её 511 px давали ~66 dpi, и
 * заказчик справедливо назвал фон размытым. Вектор режется по любому размеру,
 * весит ноль и позволяет задать цвет с прозрачностью прямо здесь.
 */
export function QMark({
  color,
  opacity,
  style,
}: {
  color: string;
  opacity: number;
  style: Sx;
}) {
  return (
    <Svg viewBox={Q_MARK.viewBox} style={style}>
      <Path d={Q_MARK.ring} fill={color} fillOpacity={opacity} />
      <Path d={Q_MARK.dot} fill={color} fillOpacity={opacity} />
    </Svg>
  );
}

/**
 * Кольцо «Q» на белом листе.
 *
 * 🛑 Абсолютный элемент с отрицательным смещением ПРЯМО в `<Page>` вешает
 * раскладку react-pdf (синхронный бесконечный цикл). Поэтому знак всегда
 * внутри контейнера с `overflow: "hidden"`.
 */
export function Watermark() {
  return (
    <View style={s.bleed} fixed>
      <QMark
        color={DECK.watermark}
        opacity={1}
        style={{ position: "absolute", top: -77, left: 317, width: 559, height: 559 }}
      />
    </View>
  );
}

/**
 * Слой во весь лист для декора и «прибитой» к макету графики.
 *
 * 🛑 Абсолютный блок, который выходит за нижнюю границу контентной области,
 * при `wrap` вешает пагинацию react-pdf (движок бесконечно пытается перенести
 * его на следующий лист). `fixed` выводит слой из потока пагинации, а
 * `overflow: "hidden"` заодно лечит вторые грабли — зависание на абсолютной
 * `<Image>` с отрицательным смещением.
 */
export function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bleed} fixed>
      {children}
    </View>
  );
}

/**
 * Фирменный зелёный градиент во весь лист (45°, accent1 → accent5). Им залиты
 * обложка и листы-разделители — в макете это одна и та же заливка.
 */
export function GreenBg() {
  return (
    <Svg
      width={PAGE_W}
      height={PAGE_H}
      style={{ position: "absolute", top: 0, left: 0 }}
    >
      <Defs>
        <LinearGradient id="greenPage" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={DECK.green} />
          <Stop offset="1" stopColor={DECK.greenDeep} />
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={PAGE_W} height={PAGE_H} fill="url(#greenPage)" />
    </Svg>
  );
}

/**
 * Два белых кольца на зелёном листе-разделителе (макеты 19 / 27 / 32).
 * Прозрачность подняли с 0.12 до 0.2 — по правке заказчика («тусклые фоновые
 * логотипы»); в макете знаки на зелёном читаются заметнее.
 */
function GreenWatermark() {
  return (
    <View style={s.bleed}>
      <QMark
        color={DECK.white}
        opacity={GREEN_WATERMARK_OPACITY}
        style={{ position: "absolute", top: -75, left: 436, width: 364, height: 364 }}
      />
      <QMark
        color={DECK.white}
        opacity={GREEN_WATERMARK_OPACITY}
        style={{ position: "absolute", top: 30, left: -120, width: 511, height: 511 }}
      />
    </View>
  );
}

// ── Каркасы листа ────────────────────────────────────────────────────────────

/**
 * Белый контентный лист: водяной знак, контент, зелёный подвал.
 *
 * 🛑 `wrap` не выставлять в `false`: у react-pdf это не «обрезать по листу», а
 * «подогнать высоту листа под контент» — страница перестаёт быть 720×405 и
 * КП разъезжается по разным форматам. Лист, в который контент не влез, должен
 * честно распасться на два — так это видно на визуальной проверке.
 */
export function Slide({ children }: { children: React.ReactNode }) {
  return (
    <Page size={PAGE_SIZE} style={s.page}>
      <Watermark />
      {children}
      <FooterBand />
    </Page>
  );
}

/**
 * Зелёный лист-разделитель: крупный заголовок на жёлтой плашке + подпись.
 *
 * Подпись принимает массив строк — в макетах она разбита на строки вручную
 * («Познакомьтесь с вашей командой / интернет-маркетинга»), и полагаться на
 * автоперенос нельзя: он оставлял на второй строке одно слово.
 */
export function GreenSlide({
  title,
  subtitle,
}: {
  title: string | readonly string[];
  subtitle: string | readonly string[];
}) {
  const lines = Array.isArray(title) ? title : [title as string];
  const subLines = Array.isArray(subtitle) ? subtitle : [subtitle as string];
  return (
    <Page size={PAGE_SIZE} style={s.greenPage}>
      <GreenBg />
      <GreenWatermark />
      <View style={s.greenCenter}>
        {lines.map((line) => (
          <View key={line} style={[s.greenTitleWrap, platePadding(44, 8)]}>
            <Text style={s.greenTitle}>{line}</Text>
          </View>
        ))}
        <View style={s.greenSubWrap}>
          {subLines.map((line, i) => (
            <Text key={i} style={s.greenSub}>
              {clean(line)}
            </Text>
          ))}
        </View>
      </View>
      <FooterBand />
    </Page>
  );
}

// ── Текстовые примитивы ──────────────────────────────────────────────────────

const RICH_RE = /(\*\*[^*]+\*\*|==[^=]+==)/g;
const HL_RE = /(==[^=]+==)/g;

const isBold = (part: string) => part.startsWith("**") && part.endsWith("**");
const isHl = (part: string) => part.startsWith("==") && part.endsWith("==");

/** Разбор разметки в **уже подготовленной** (`clean`) строке. */
function markup(text: string): React.ReactNode[] {
  return text
    .split(RICH_RE)
    .filter((part) => part !== "")
    .map((part, i) => {
      if (isBold(part)) {
        return (
          <Text key={i} style={{ fontWeight: 700 }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (isHl(part)) {
        // Внутри абзаца, который может перенестись, плашкой хайлайт не сделать —
        // остаётся inline-вариант. Для отдельных строк есть `HlLine` (ниже).
        return (
          <Text key={i} style={{ backgroundColor: DECK.yellow }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      // Кусок без разметки отдаём строкой, а не <Text>: лишний вложенный узел
      // react-pdf считает отдельным фрагментом и подмешивает в лист Helvetica.
      return part;
    });
}

/**
 * Разметка текстов слайдов: `**жирный**` и `==жёлтый хайлайт==`.
 *
 * Нужна, потому что в макетах акценты стоят посреди фразы («Команду из 3–5
 * человек **по цене 1 специалиста в штате**»), а собирать такие строки из
 * массивов кусков в `lib/pitch.ts` нечитаемо.
 */
export function rich(text: string): React.ReactNode[] {
  return markup(clean(text));
}

/** `rich()` в виде компонента — когда стиль задаётся снаружи. */
export function Rich({ text, style }: { text: string; style?: Sx }) {
  return <Text style={style ?? {}}>{rich(text)}</Text>;
}

/**
 * Строка, в которой кусок фразы подсвечен жёлтым (`==…==`).
 *
 * 🛑 Хайлайт — **настоящая плашка** (`View` с фоном), а не `backgroundColor`
 * на inline-`<Text>`. У inline-варианта высоту подложки задаёт строчная
 * коробка шрифта: глиф сидит в её нижней части, поэтому жёлтое выпирает над
 * прописными и почти касается базовой линии снизу — сколько ни подбирай
 * `lineHeight`, симметрии не выходит. Здесь геометрия задана числом
 * (`plateText` в theme.ts), и от метрик шрифта она не зависит.
 *
 * Строка собирается флекс-рядом из кусков. У всех кусков — плашек и обычного
 * текста — одинаковая внутренняя геометрия, поэтому базовые линии совпадают;
 * `alignItems: "flex-end"` держит плашку на последней строке, если обычный
 * кусок всё-таки перенёсся.
 */
export function HlLine({
  text,
  size,
  textStyle,
  style,
}: {
  /** Строка с разметкой `**жирный**` и `==жёлтый==`. */
  text: string;
  size: number;
  /** Цвет и начертание текста; вертикальную геометрию задаёт `plateText`. */
  textStyle?: Sx;
  /** Стиль строки-контейнера (отступы). */
  style?: Sx;
}) {
  const geom = plateText(size);
  const space = PLATE_SPACE_RATIO * size;
  // Пробел на стыке с плашкой рисуем отступом, а не пробелом в тексте:
  // react-pdf срезает пробел в конце `<Text>`, и слово прилипало бы к плашке.
  let gapBefore = false;

  const items = clean(text)
    .split(HL_RE)
    .flatMap((part) => {
      if (part === "") return [];
      const hl = isHl(part);
      const body = hl ? part.slice(2, -2) : part;
      const lead = /^\s/.test(body);
      const trimmed = body.trim();
      if (trimmed === "") {
        gapBefore = true;
        return [];
      }
      const item = { hl, text: trimmed, gap: gapBefore || lead };
      gapBefore = /\s$/.test(body);
      return [item];
    });

  return (
    <View style={[{ flexDirection: "row", alignItems: "flex-end" }, style ?? {}]}>
      {items.map((item, i) => (
        <View
          key={i}
          style={[
            item.hl
              ? {
                  flexShrink: 0,
                  backgroundColor: DECK.yellow,
                  borderRadius: R.sm,
                  paddingHorizontal: PLATE_INSET_RATIO * size,
                }
              : { flexShrink: 1 },
            i > 0 && item.gap ? { marginLeft: space } : {},
          ]}
        >
          <Text style={[textStyle ?? {}, { fontSize: size }, geom]}>
            {markup(item.text)}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Шапка слайда: чёрный заголовок и, если нужно, вторая строка на жёлтой плашке.
 * `size` подгоняет кегль заголовка под длину строки (в макете 25…32 pt).
 */
export function SlideHead({
  title,
  subtitle,
  size = 27,
  subSize = 16,
  subGap = 10,
  style,
}: {
  /** Строка (можно с разметкой `**` / `==`) либо массив строк-строчек. */
  title: string | readonly string[];
  subtitle?: string;
  size?: number;
  subSize?: number;
  /** Отступ под жёлтой подписью: на плотных листах его ужимают. */
  subGap?: number;
  style?: Sx;
}) {
  const lines = Array.isArray(title) ? title : [title as string];
  // Междустрочие: высоту строки задаёт геометрия плашки (`plateText`), а воздух
  // между строками добавляем отступом — так расстояние между базовыми линиями
  // одинаково и у строк с жёлтым выделением, и без него.
  const lineGap = size * 0.19;
  return (
    <View style={style ?? {}}>
      {/* Каждая строка — отдельный узел: перевод строки внутри одного `<Text>`
          react-pdf считает новым абзацем и подмешивает в лист Helvetica. */}
      {lines.map((line, i) => (
        <HlLine
          key={i}
          text={line}
          size={size}
          textStyle={s.h1}
          style={{ marginBottom: i < lines.length - 1 ? lineGap : 4 }}
        />
      ))}
      {!!subtitle && (
        <View
          style={[
            s.subLine,
            platePadding(subSize, 4),
            { paddingHorizontal: 4, marginBottom: subGap },
          ]}
        >
          <Text style={[s.subText, { fontSize: subSize }]}>{clean(subtitle)}</Text>
        </View>
      )}
    </View>
  );
}

/** Мелкий жирный подзаголовок внутри колонки («Что мы делаем:»). */
export function Kicker({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: Sx;
}) {
  return <Text style={[s.kicker, style ?? {}]}>{children}</Text>;
}

/** Список с зелёными маркерами. */
export function Bullets({
  items,
  size = 11,
  gap = 5,
}: {
  items: readonly (string | React.ReactNode)[];
  size?: number;
  gap?: number;
}) {
  return (
    <>
      {items.map((item, i) => (
        <View key={i} style={[s.li, { marginBottom: gap }]}>
          <View style={s.liDot} />
          <Text style={[s.liText, { fontSize: size }]}>
            {typeof item === "string" ? rich(item) : item}
          </Text>
        </View>
      ))}
    </>
  );
}

/** Плашка-заметка «#A8D08C» — вывод колонки на слайдах направлений. */
export function NoteBox({
  children,
  size = 10,
  style,
}: {
  /** Строка (с разметкой) либо готовые блоки — например несколько строк. */
  children: React.ReactNode;
  size?: number;
  style?: Sx;
}) {
  return (
    <View style={[s.note, style ?? {}]}>
      {typeof children === "string" ? (
        <Text style={{ fontSize: size, lineHeight: 1.3 }}>{rich(children)}</Text>
      ) : (
        children
      )}
    </View>
  );
}

// ── Аватар ───────────────────────────────────────────────────────────────────

/**
 * Круглое фото в жёлтой рамке. Байты приходят из таблицы `manager_photos`
 * (см. `lib/pdf/photos.ts`); нет фото — кружок с инициалами, как в вебе.
 *
 * 🛑 Рамку нельзя делать бордером на том же блоке, что и картинку: `overflow`
 * режет содержимое по ОКРУЖНОСТИ БОРДЕР-БОКСА, а квадратная картинка внутри
 * достаёт до неё по диагоналям — от жёлтого кольца остаются четыре серпика по
 * сторонам света («рамка не по кругу», правка заказчика). Поэтому кольцо и
 * картинка — два вложенных круга: внешний жёлтый и внутренний, меньше на
 * толщину кольца, уже со своим `overflow: hidden`.
 */
export function Avatar({
  src,
  name,
  size,
  ring = 2,
}: {
  src?: { data: Buffer; format: "png" | "jpg" } | string | null;
  name: string;
  size: number;
  /** Толщина жёлтого кольца. */
  ring?: number;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const inner = size - 2 * ring;

  return (
    <View style={[s.avatarRing, { width: size, height: size, borderRadius: size / 2 }]}>
      <View
        style={[s.avatarInner, { width: inner, height: inner, borderRadius: inner / 2 }]}
      >
        {src ? (
          <Image src={src} style={s.avatarImg} />
        ) : (
          <Text style={[s.avatarInitials, { fontSize: size * 0.34 }]}>
            {initials || "?"}
          </Text>
        )}
      </View>
    </View>
  );
}

/**
 * Картинка в жёлтой рамке — награды, сканы отзывов, обложки кейсов, карта.
 *
 * Углы прямые: скругления добавлялись по правке заказчика к плашкам и
 * карточкам, но фоторамки он попросил вернуть к макету — там они острые.
 *
 * 🛑 Рамку нельзя вешать прямо на `<Image>`: при `objectFit: "cover"` картинка
 * рисуется поверх бордера, и от рамки остаётся полоска в пару пикселей у края
 * (проверено пиксельным замером). Поэтому рамка — на контейнере с
 * `overflow: "hidden"`, а картинка внутри на все 100%.
 */
export function Framed({
  src,
  style,
  radius = 0,
}: {
  src: string;
  /** Размеры рамки: ширина/высота/flex — как у обычного блока. */
  style?: Sx;
  radius?: number;
}) {
  return (
    <View
      style={[
        {
          borderWidth: 3,
          borderColor: DECK.yellow,
          borderRadius: radius,
          overflow: "hidden",
        },
        style ?? {},
      ]}
    >
      <Image src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </View>
  );
}

// ── Кнопки ───────────────────────────────────────────────────────────────────

/** Жёлтая кнопка-таблетка со ссылкой (в макете — `roundRect adj=50000`). */
export function PillLink({
  href,
  children,
  size = 11,
  ghost,
  style,
}: {
  href: string;
  children: string;
  size?: number;
  ghost?: boolean;
  style?: Sx;
}) {
  return (
    <Link
      src={href}
      style={[
        s.pill,
        platePadding(size, 6),
        ghost ? s.pillGhost : {},
        style ?? {},
        { textDecoration: "none" },
      ]}
    >
      <Text style={[s.pillText, { fontSize: size }]}>{children}</Text>
    </Link>
  );
}

/** Иконка «указатель» рядом с кнопкой — как в макете. */
export function Cursor({ size = 26, style }: { size?: number; style?: Sx }) {
  return <Image src={ICON.hand} style={[{ width: size, height: size }, style ?? {}]} />;
}
