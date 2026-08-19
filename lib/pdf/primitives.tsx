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
  Rect,
  Stop,
  StyleSheet,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";
import { COMPANY } from "../company";
import { LOGO, ICON } from "./assets";
import {
  centerTextTop,
  clean,
  DECK,
  type Sx,
  FONT,
  FOOTER_H,
  PAD_BOTTOM,
  PAD_TOP,
  PAD_X,
  PAGE_H,
  PAGE_SIZE,
  PAGE_W,
  R,
  WORDMARK_RATIO,
  platePadding,
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
  footerPhone: {
    position: "absolute",
    top: centerTextTop(FOOTER_H, 8),
    left: 133.5,
    fontSize: 8,
    lineHeight: 1,
    color: DECK.note,
    textDecoration: "none",
  },
  footerMail: {
    position: "absolute",
    top: centerTextTop(FOOTER_H, 9),
    left: 238.4,
    fontSize: 9,
    lineHeight: 1,
    color: DECK.note,
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
  h1: {
    fontSize: 27,
    fontWeight: 700,
    color: DECK.black,
    lineHeight: 1.1,
    marginBottom: 4,
  },
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
  avatar: {
    overflow: "hidden",
    borderWidth: 2,
    borderColor: DECK.yellow,
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
  greenSub: {
    fontSize: 21,
    fontWeight: 700,
    color: DECK.white,
    textAlign: "center",
    lineHeight: 1.25,
    marginTop: 16,
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
 * Кольцо «Q» на белом листе.
 *
 * 🛑 Абсолютная `<Image>` с отрицательным смещением ПРЯМО в `<Page>` вешает
 * раскладку react-pdf (синхронный бесконечный цикл). Поэтому картинка всегда
 * внутри контейнера с `overflow: "hidden"`.
 */
export function Watermark() {
  return (
    <View style={s.bleed} fixed>
      <Image
        src={LOGO.qGrey}
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

/** Два белых кольца на зелёном листе-разделителе (макеты 19 / 27 / 32). */
function GreenWatermark() {
  return (
    <View style={s.bleed}>
      <Image
        src={LOGO.qWhite}
        style={{
          position: "absolute",
          top: -75,
          left: 436,
          width: 364,
          height: 364,
          opacity: 0.12,
        }}
      />
      <Image
        src={LOGO.qWhite}
        style={{
          position: "absolute",
          top: 30,
          left: -120,
          width: 511,
          height: 511,
          opacity: 0.12,
        }}
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

/** Зелёный лист-разделитель: крупный заголовок на жёлтой плашке + подпись. */
export function GreenSlide({
  title,
  subtitle,
}: {
  title: string | string[];
  subtitle: string;
}) {
  const lines = Array.isArray(title) ? title : [title];
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
        <Text style={s.greenSub}>{clean(subtitle)}</Text>
      </View>
      <FooterBand />
    </Page>
  );
}

// ── Текстовые примитивы ──────────────────────────────────────────────────────

/** Инлайновый жёлтый хайлайт — как `<a:highlight>` в макете. */
export function Hl({ children }: { children: React.ReactNode }) {
  return <Text style={{ backgroundColor: DECK.yellow }}>{children}</Text>;
}

const RICH_RE = /(\*\*[^*]+\*\*|==[^=]+==)/g;

/**
 * Разметка текстов слайдов: `**жирный**` и `==жёлтый хайлайт==`.
 *
 * Нужна, потому что в макетах акценты стоят посреди фразы («Команду из 3–5
 * человек **по цене 1 специалиста в штате**»), а собирать такие строки из
 * массивов кусков в `lib/pitch.ts` нечитаемо. Хайлайт делается вложенным
 * `<Text>` с `backgroundColor` — react-pdf красит его построчно, ровно как
 * `<a:highlight>` в презентации.
 */
export function rich(text: string): React.ReactNode[] {
  return clean(text)
    .split(RICH_RE)
    .filter((part) => part !== "")
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <Text key={i} style={{ fontWeight: 700 }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      if (part.startsWith("==") && part.endsWith("==")) {
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

/** `rich()` в виде компонента — когда стиль задаётся снаружи. */
export function Rich({ text, style }: { text: string; style?: Sx }) {
  return <Text style={style ?? {}}>{rich(text)}</Text>;
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
  return (
    <View style={style ?? {}}>
      {/* Каждая строка — отдельный <Text>: перевод строки внутри одного узла
          react-pdf считает новым абзацем и подмешивает в лист Helvetica. */}
      {lines.map((line, i) => (
        <Text
          key={i}
          style={[s.h1, { fontSize: size }, i < lines.length - 1 ? { marginBottom: 0 } : {}]}
        >
          {rich(line)}
        </Text>
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
 */
export function Avatar({
  src,
  name,
  size,
}: {
  src?: { data: Buffer; format: "png" | "jpg" } | string | null;
  name: string;
  size: number;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      {src ? (
        <Image src={src} style={s.avatarImg} />
      ) : (
        <Text style={[s.avatarInitials, { fontSize: size * 0.34 }]}>
          {initials || "?"}
        </Text>
      )}
    </View>
  );
}

/**
 * Картинка в жёлтой рамке — награды, сканы отзывов, обложки кейсов, карта.
 *
 * 🛑 Рамку нельзя вешать прямо на `<Image>`: при `objectFit: "cover"` картинка
 * рисуется поверх бордера, и от рамки остаётся полоска в пару пикселей у края
 * (проверено пиксельным замером). Поэтому рамка — на контейнере с
 * `overflow: "hidden"`, а картинка внутри на все 100%.
 */
export function Framed({
  src,
  style,
  radius = R.md,
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
