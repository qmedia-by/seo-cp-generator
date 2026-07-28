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
  siteUrl: "https://qmedia.by",
  foundedYear: 2007,
  clients: "3590+",
  employees: 34,
  /** Контактное лицо (account-менеджер) — из референса. */
  manager: {
    name: "Андрей Марушко",
    role: "IT Account-менеджер Qmedia",
    phone: "+375 (29) 363-10-57",
    email: "am@qmedia.by",
  },
} as const;

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
  // Шрифт с кириллицей
  fontRegular: "public/fonts/QmediaSans-Regular.ttf",
  fontBold: "public/fonts/QmediaSans-Bold.ttf",
} as const;

/** Корпоративные фото (public-пути). Используются в PDF и на обложке. */
export const PHOTOS = {
  cover: "print-004.jpg", // переговорная с клиентом — для обложки КП
  team: ["print-001.jpg", "print-003.jpg", "print-004.jpg", "print-012.jpg"],
} as const;

/**
 * Преимущества работы с Qmedia — слайд «Почему Qmedia».
 * Формулировки согласованы SEO-отделом (sources/SEO_CP_SLIDES.md); вводный и финальный
 * абзацы того же слайда — в `PITCH_WHY` (lib/pitch.ts).
 */
export const ADVANTAGES: { title: string; text: string }[] = [
  {
    title: "Комплексный подход",
    text: "Работаем не только с позициями, но и с контентом, репутацией, технической базой, аналитикой и AI-поиском.",
  },
  {
    title: "Команда внутри агентства",
    text: "Над проектом работают SEO-специалисты, программисты, копирайтеры, аналитики и Project-менеджер.",
  },
  {
    title: "Прозрачность",
    text: "Клиент видит, какие задачи выполнены, какие показатели изменились и что будет сделано дальше.",
  },
  {
    title: "Опыт в разных нишах",
    text: "Умеем адаптировать SEO под специфику бизнеса: от локальных услуг до крупных каталогов и B2B-проектов.",
  },
  {
    title: "Работа на бизнес-цели",
    text: "Наша задача — не просто вывести запросы в ТОП, а помочь сайту привлекать целевых пользователей и превращать их в обращения.",
  },
];
