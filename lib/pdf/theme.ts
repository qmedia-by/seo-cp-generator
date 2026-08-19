// Оформление PDF: геометрия листа, палитра макетов, шрифты и оптические хелперы.
//
// Источник — презентация дизайнера (Google Slides, канва 9144000×5143500 EMU =
// ровно 720×405 pt). Поэтому координаты из макета переносятся в код 1:1, без
// пересчёта: если в макете блок стоит на x=25.4, здесь это 25.4 pt.
//
// Цвета сверены с XML презентации и пиксельным замером её PDF-экспорта.

import path from "node:path";
import { Font } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

/** Стиль react-pdf — для пропов `style` у собственных примитивов. */
export type Sx = Style;

// --- Геометрия листа -------------------------------------------------------

/** Канва макета: 16:9, 720×405 pt. */
export const PAGE_W = 720;
export const PAGE_H = 405;
export const PAGE_SIZE: [number, number] = [PAGE_W, PAGE_H];

/** Зелёная полоса подвала: в макете начинается на y=353.7 и идёт до низа. */
export const FOOTER_H = 51;
export const FOOTER_TOP = PAGE_H - FOOTER_H;

/** Поля контента. В макете левый край гуляет 23…31 pt — канонизируем в 26. */
export const PAD_X = 26;
/** Верх заголовка слайда (в макете y=16.1). */
export const PAD_TOP = 16;
/** Воздух между контентом и зелёной полосой подвала. */
export const PAD_BOTTOM = FOOTER_H + 10;

/** Пропорции логотипов (файлы в public/brand). */
export const WORDMARK_RATIO = 2048 / 656; // ≈ 3.12

// --- Палитра ---------------------------------------------------------------

/**
 * Палитра макетов. Зелёный и жёлтый совпадают с `BRAND` (lib/company.ts);
 * остальное — производные оттенки, которые ввёл дизайнер и которые нигде,
 * кроме PDF, не используются (поэтому в `BRAND`/tailwind их не тащим).
 */
export const DECK = {
  /** accent1 темы презентации — он же BRAND.green. */
  green: "#53BD35",
  /** accent5 — тёмный край градиента подвала. */
  greenDeep: "#348923",
  /** accent2 — жёлтый хайлайт. Только подложка, никогда не текст. */
  yellow: "#FFDE00",
  /** Крупные цифры «1…4» на слайде ожиданий. */
  yellowSoft: "#FEEF86",
  /** Плашка-заметка («Сайт должен быть видимым…»). */
  note: "#A8D08C",
  /** Плашка-факт («70% изменений в алгоритмах…»). */
  fact: "#D9EAD3",
  /** Маркер списка. */
  bullet: "#A1E090",
  /** Светло-серая карточка. */
  card: "#F3F3F3",
  /** Рамка карточек «экосистема из 5 типов SEO». */
  cardLine: "#E7E6E6",

  ink: "#151515",
  black: "#000000",
  caption: "#3F3F3F",
  muted: "#888888",
  grey: "#999999",
  greyLight: "#9E9E9E",
  line: "#D9D9D9",
  white: "#FFFFFF",
} as const;

/**
 * Скругления. В макетах углы почти везде острые — скругление добавлено по
 * правке заказчика; шкала выбрана «небольшой», чтобы не спорить с макетом.
 * `pill` — то, что у дизайнера уже скруглено до таблетки (`roundRect adj=50000`).
 */
export const R = { sm: 3, md: 6, lg: 10, pill: 999 } as const;

// --- Шрифты ----------------------------------------------------------------

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

/**
 * PT Sans (OFL) под именем QmediaSans. Verdana из макета проприетарна и
 * отгружаться не может.
 *
 * Курсив в макетах встречается часто (подписи фактов, формат отчётности,
 * описания инструментов), а react-pdf курсив **не синтезирует** — без файла
 * начертания рендер падает с «Could not resolve font».
 */
Font.register({
  family: "QmediaSans",
  fonts: [
    { src: path.join(FONT_DIR, "QmediaSans-Regular.ttf") },
    { src: path.join(FONT_DIR, "QmediaSans-Bold.ttf"), fontWeight: 700 },
    { src: path.join(FONT_DIR, "QmediaSans-Italic.ttf"), fontStyle: "italic" },
    {
      src: path.join(FONT_DIR, "QmediaSans-BoldItalic.ttf"),
      fontStyle: "italic",
      fontWeight: 700,
    },
  ],
});
/**
 * Переносы: по слогам не переносим (для кириллицы выглядит чище), но разрешаем
 * перенос ПОСЛЕ дефиса — и делаем это так, чтобы react-pdf не дорисовывал
 * второй дефис.
 *
 * 🛑 Грабли react-pdf. Слово с переходом латиница→кириллица («AI-поиск»,
 * «SEO-поддержка», «Project-менеджер») разрезается на два фрагмента ещё до
 * переноса слов: `scriptItemizer` в @react-pdf/textkit режет строку на runs по
 * юникод-скрипту, а `wrapWords` собирает «слоги» уже внутри каждого run. Между
 * двумя соседними непробельными слогами кладётся penalty-узел, и при переносе
 * в этом месте `breakLines` **безусловно** дописывает дефис — получается
 * «AI--поиск». Кегль, ширина и `hyphenationPenalty` тут не спасают (проверено:
 * значения до 5000 не меняют раскладку, 9999+ ломают её).
 *
 * Лечение: возвращаем из колбэка **пустой слог** после каждого куска,
 * заканчивающегося дефисом. Пустая строка проходит проверку `s.trim() === ''`
 * и становится glue-узлом нулевой ширины: точка переноса остаётся, а
 * penalty-узла (и лишнего дефиса) больше нет. Заодно так переносятся и чисто
 * кириллические слова через дефис («интернет-маркетинг»), которые раньше просто
 * вылезали за край блока.
 */
Font.registerHyphenationCallback((word) => {
  const parts = word.split(/(?<=-)/);
  if (parts.length === 1 && !word.endsWith("-")) return [word];
  return parts.flatMap((part) => (part.endsWith("-") ? [part, ""] : [part]));
});

export const FONT = "QmediaSans";

// --- Оптическое центрирование ----------------------------------------------

/**
 * При `lineHeight: 1` react-pdf сажает базовую линию почти на низ строчного
 * бокса, поэтому глиф оказывается НИЖЕ центра плашки на `0.164 × кегль` — и при
 * `justifyContent: "center"`, и при симметричных paddings. Компенсируем нижним
 * отступом: он увеличивает бокс снизу и поднимает глиф на половину своей
 * величины, отсюда множитель 2.
 *
 * Коэффициент выверен пиксельным замером рендера на кеглях 8 / 10.5 / 14
 * (смещение строго пропорционально кеглю).
 *
 * 🛑 Хелперы работают ТОЛЬКО вместе с `lineHeight: 1`. При унаследованном 1.4
 * глиф, наоборот, встаёт чуть выше центра, и поправка удваивает ошибку.
 */
export const GLYPH_SINK_RATIO = 0.1638;

/** Для flex-центрирования (кружки нумерации). */
export function opticalCenter(fontSize: number) {
  return { lineHeight: 1, marginBottom: 2 * GLYPH_SINK_RATIO * fontSize };
}

/**
 * То же для плашки, высота которой задана паддингами (жёлтые блоки сумм):
 * переносим «просадку» сверху вниз. Высота плашки при этом не меняется.
 */
export function platePadding(fontSize: number, pad: number) {
  const sink = GLYPH_SINK_RATIO * fontSize;
  return { paddingTop: pad - sink, paddingBottom: pad + sink };
}

/** `top` для абсолютной строки, чтобы она встала по центру полосы высотой `h`. */
export function centerTextTop(h: number, fontSize: number) {
  return h / 2 - (fontSize / 2 + GLYPH_SINK_RATIO * fontSize);
}

/** В PT Sans нет глифов стрелок — заменяем на тире. */
export function clean(str: string): string {
  return str.replace(/[→←↔]/g, "—");
}
