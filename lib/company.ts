// Данные компании и фирстиль Qmedia.
// Всё, что может меняться (контакты, цвета, факты), собрано здесь.

// Фирстиль Qmedia: основной цвет — зелёный (#53BD35), акцент — жёлтый (#FFDE00).
// Чёрный почти не используется как фон/заливка (только тёмный текст). Значения
// сверены с каноническим CSS qmedia.by.
export const BRAND = {
  green: "#53BD35", // основной
  greenDark: "#3D9A3A", // ховеры, тёмный край градиента
  greenDeep: "#2F8E2A", // самый тёмный край градиента колонтитула
  greenTint: "#E4F4DF", // светлая зелёная подложка
  greenSoft: "#F5FBF4", // едва зелёный фон
  yellow: "#FFDE00", // акцент (хайлайты, итоговая сумма)
  yellowDark: "#E6C800", // ховер по жёлтому
  black: "#080808", // используется редко
  ink: "#151515", // основной текст
  gray: "#666666",
  mute: "#8D8D8D",
  white: "#FFFFFF",
  light: "#F6F7F9",
} as const;

export const COMPANY = {
  name: "Qmedia",
  site: "qmedia.by",
  siteUrl: "https://www.qmedia.by/",
  foundedYear: 2007,
  clients: "3590+",
  employees: 48,
  reviews: "80+",
  projects: "2000",
  /** Общий отдел продаж — подвал каждого слайда PDF и слайд контактов. */
  phone: "+375 (29) 335-23-23",
  phoneHref: "tel:+375293352323",
  email: "sales@qmedia.by",
  address: "Минск, ул. Притыцкого 2/3, 3 этаж, офис 23",
  /** Контактное лицо (account-менеджер) — из референса. */
  manager: {
    name: "Андрей Марушко",
    role: "IT Account-менеджер Qmedia",
    phone: "+375 (29) 363-10-57",
    email: "am@qmedia.by",
  },
} as const;

/**
 * Внешние адреса, на которые ссылается PDF. Собраны из презентации дизайнера —
 * в макетах эти ссылки живые, и в выгрузке они должны остаться кликабельными.
 */
export const LINKS = {
  clients: "https://www.qmedia.by/kejsy_i_klienty/klienty.html",
  reviews: "https://www.qmedia.by/kejsy_i_klienty/otzyvy_klientov.html",
  awards: "https://www.qmedia.by/o_kompanii/nashi_nagrady.html",
  cases: "https://www.qmedia.by/kejsy_i_klienty/marketingovye_kejsy.html",
  paidTools:
    "https://www.qmedia.by/vyvedem_vash_biznes_na_novyj_uroven_s_pomoshhyu_digital-voronki.html#paid-tools",
} as const;

/** Соцсети и мессенджеры — слайд «Давайте начнём сотрудничать». */
export const SOCIALS = [
  { key: "telegram", title: "Telegram", url: "https://t.me/qmediaby" },
  { key: "tiktok", title: "TikTok", url: "https://www.tiktok.com/@qmedia.by" },
  {
    key: "whatsapp",
    title: "WhatsApp",
    url: "https://api.whatsapp.com/send?phone=+375293352323",
  },
  { key: "facebook", title: "Facebook", url: "https://www.facebook.com/Qmedia.by" },
  {
    key: "instagram",
    title: "Instagram",
    url: "https://www.instagram.com/qmedia.by/",
  },
] as const;

/**
 * Ресурсы бренда.
 * - SVG-логотипы (`/brand/logo-*.svg`) — для веб-интерфейса (вордмарк 469×150,
 *   знак-кружок 150×150; цвета: white/green/black).
 * - PNG белые логотипы — для PDF: @react-pdf/renderer не умеет грузить SVG
 *   через <Image>, поэтому на зелёных подложках используем растровые белые.
 */
export const BRAND_ASSETS = {
  // Веб (public-пути для <img src>)
  logoWordmark: "/brand/logo-white.svg",
  logoWordmarkGreen: "/brand/logo-green.svg",
  logoWordmarkBlack: "/brand/logo-black.svg",
  logoMark: "/brand/logo-circle-white.svg",
  logoMarkGreen: "/brand/logo-circle-green.svg",
  // PDF (белые растровые для зелёного фона)
  qMarkWhite: "public/brand/qmedia-q-white.png",
  wordmarkWhite: "public/brand/qmedia-wordmark-white.png",
  // Шрифт PDF — Verdana (шрифт макетов и презентаций Qmedia);
  // регистрируется в lib/pdf/theme.ts. Обычное начертание — без суффикса.
  fontRegular: "public/fonts/Verdana.ttf",
  fontBold: "public/fonts/Verdana-Bold.ttf",
  // Шрифт веб-интерфейса — PT Sans под именем QmediaSans (@font-face в globals.css).
  webFontRegular: "public/fonts/QmediaSans-Regular.ttf",
  webFontBold: "public/fonts/QmediaSans-Bold.ttf",
} as const;

