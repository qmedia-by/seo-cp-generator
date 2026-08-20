// Пути к картинкам PDF.
//
// `public/deck/*` — графика из презентации дизайнера (иконки, логотипы
// сервисов, награды, сканы отзывов, карта). Вынута из `.pptx` один раз и
// пережата: исходники весили ~6 МБ ради картинок 100×160 pt.
//
// **Экономить весом, а не пикселями.** КП смотрят с экрана и зумят, поэтому
// ×3 от размера отрисовки (300 dpi, норма печати) на сканах и карте даёт
// видимое мыло — проверено на отзывах и `map-office`. Держим ×5…×6 и
// сжимаем форматом: фотографическое (награды, сканы отзывов, обложки кейсов,
// карта, фото команды) — JPEG качества 92, знаки и всё с прозрачностью
// (иконки, воронка «путь клиента», логотипы) — PNG. Перевод сканов из PNG
// в JPEG 92 снял 3.7 МБ из 6.4 МБ PDF, не тронув ни одного пикселя.
//
// `public/brand/*` — фирменные логотипы (белые PNG: react-pdf не грузит SVG).

import path from "node:path";

const BRAND_DIR = path.join(process.cwd(), "public", "brand");
const DECK_DIR = path.join(process.cwd(), "public", "deck");

const deck = (file: string) => path.join(DECK_DIR, file);

export const LOGO = {
  /** Белый вордмарк «Qmedia» — на зелёном (подвал, обложка). */
  wordmarkWhite: path.join(BRAND_DIR, "qmedia-wordmark-white.png"),
} as const;

/**
 * Знак «Q» в координатах брендового SVG (`public/brand/logo-circle-*.svg`,
 * viewBox 150×150) — водяные знаки рисуются вектором, а не картинкой.
 *
 * Раньше это был растр (`bg-q-grey.png`, 511×511 px на 559 pt отрисовки ≈ 66
 * dpi) и он заметно мылил; вектор режется по любому размеру и заодно позволяет
 * менять цвет и прозрачность прямо в коде.
 */
export const Q_MARK = {
  viewBox: "0 0 150 150",
  /** Внешнее кольцо с вырезом справа снизу. */
  ring:
    "M100.3 128.912C93.8178 131.796 86.7801 133.291 79.6896 133.291C51.5522 " +
    "133.291 28.7459 110.469 28.7459 82.3293C28.7459 54.1894 51.5654 31.368 " +
    "79.6896 31.368C107.814 31.368 130.646 54.1894 130.646 82.3293C130.646 " +
    "95.7708 125.395 107.956 116.902 117.071L126.36 129.626C140.912 115.933 " +
    "150 96.5382 150 74.9867C149.987 33.5773 116.399 0 74.9934 0C33.5876 0 0 " +
    "33.5773 0 75C0 116.423 33.5744 150 74.9934 150C87.0976 150.013 99.0299 " +
    "147.089 109.758 141.467L100.3 128.912Z",
  /** Внутренний круг. */
  dot:
    "M49.1182 82.3159C49.1182 99.1995 62.8099 112.881 79.6897 112.881C96.5695 " +
    "112.881 110.261 99.1863 110.261 82.3159C110.261 65.4454 96.5827 51.7374 " +
    "79.6897 51.7374C62.7966 51.7374 49.1182 65.419 49.1182 82.3159Z",
} as const;

/** Контурные иконки слайдов «Здесь и сейчас», «Гарантии», «Почему дешевле». */
export const ICON = {
  key: deck("icon-key.png"),
  books: deck("icon-books.png"),
  chart: deck("icon-chart.png"),
  team: deck("icon-team.png"),
  servers: deck("icon-servers.png"),
  gear: deck("icon-gear.png"),
  cms: deck("icon-cms.png"),
  expertise: deck("icon-expertise.png"),
  handshake: deck("icon-handshake.png"),
  warning: deck("icon-warning.png"),
  hand: deck("icon-hand.png"),
} as const;

/** Схема «путь клиента» — растр из макета: текст воронки вшит в картинку. */
export const JOURNEY_FUNNEL = deck("journey-funnel.png");

/** Фото профильной команды (слайд «Профильная команда»). */
export const TEAM_PHOTO = {
  seoHead: deck("team-seo-head.jpg"),
  seo: deck("team-seo.jpg"),
  dev: deck("team-dev.jpg"),
  copy: deck("team-copy.jpg"),
  serm: deck("team-serm.jpg"),
  analyst: deck("team-analyst.jpg"),
} as const;

/** Логотипы платного инструментария. */
export const TOOL_LOGO = {
  ahrefs: deck("tool-ahrefs.png"),
  keysso: deck("tool-keysso.png"),
  seranking: deck("tool-seranking.png"),
  yandexWebmaster: deck("tool-yandex-webmaster.jpg"),
  topvisor: deck("tool-topvisor.png"),
  arsenkin: deck("tool-arsenkin.png"),
  miratext: deck("tool-miratext.png"),
  textru: deck("tool-textru.png"),
  istio: deck("tool-istio.png"),
  wordstat: deck("tool-wordstat.png"),
  screamingfrog: deck("tool-screamingfrog.png"),
  apollon: deck("tool-apollon.png"),
  gsc: deck("tool-gsc.png"),
  pagespeed: deck("tool-pagespeed.png"),
} as const;

/** Награды «Рейтинга Рунета», логотипы клиентов, сканы отзывов, обложки кейсов. */
export const AWARD = [
  deck("award-seo.jpg"),
  deck("award-ppc.jpg"),
  deck("award-dev.jpg"),
] as const;

export const CLIENTS_LOGOS = deck("clients-logos.png");

export const REVIEWS = [
  deck("review-1.jpg"),
  deck("review-2.jpg"),
  deck("review-3.jpg"),
  deck("review-4.jpg"),
  deck("review-5.jpg"),
] as const;

export const CASE_COVER = {
  lingerie: deck("case-lingerie.jpg"),
  running: deck("case-running.jpg"),
  medical: deck("case-medical.jpg"),
} as const;

export const MAP_OFFICE = deck("map-office.jpg");

export const SOCIAL_ICON = {
  telegram: deck("social-telegram.png"),
  tiktok: deck("social-tiktok.png"),
  whatsapp: deck("social-whatsapp.png"),
  facebook: deck("social-facebook.png"),
  instagram: deck("social-instagram.png"),
} as const;
