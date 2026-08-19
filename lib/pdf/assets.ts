// Пути к картинкам PDF.
//
// `public/deck/*` — графика из презентации дизайнера (иконки, логотипы
// сервисов, награды, сканы отзывов, карта). Вынута из `.pptx` один раз и
// пережата под фактический размер отрисовки ×3 (≈300 dpi): исходники весили
// ~6 МБ ради картинок 100×160 pt.
//
// `public/brand/*` — фирменные логотипы (белые PNG: react-pdf не грузит SVG).

import path from "node:path";

const BRAND_DIR = path.join(process.cwd(), "public", "brand");
const DECK_DIR = path.join(process.cwd(), "public", "deck");

const deck = (file: string) => path.join(DECK_DIR, file);

export const LOGO = {
  /** Белый вордмарк «Qmedia» — на зелёном (подвал, обложка). */
  wordmarkWhite: path.join(BRAND_DIR, "qmedia-wordmark-white.png"),
  /** Белый знак-кольцо «Q» — водяной знак на зелёных листах. */
  qWhite: path.join(BRAND_DIR, "qmedia-q-white.png"),
  /** Серое кольцо «Q» — водяной знак на белых листах (из макета). */
  qGrey: deck("bg-q-grey.png"),
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
  clip: deck("icon-clip.png"),
  thumb: deck("icon-thumb.png"),
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
