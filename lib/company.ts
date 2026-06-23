// Данные компании и фирстиль Qmedia.
// Всё, что может меняться (контакты, цвета, факты), собрано здесь.

export const BRAND = {
  yellow: "#FFDE00",
  black: "#080808",
  ink: "#151515",
  green: "#53BD35",
  greenDark: "#3D9A3A",
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

/** Пути к ресурсам бренда (заполняются на шаге брендинга). */
export const BRAND_ASSETS = {
  /** Белый знак «Q» для тёмного фона. */
  qMarkWhite: "public/brand/qmedia-q-white.png",
  /** Белый вордмарк для тёмного фона. */
  wordmarkWhite: "public/brand/qmedia-wordmark-white.png",
  /** Шрифт с кириллицей для PDF (TTF). */
  fontRegular: "public/fonts/QmediaSans-Regular.ttf",
  fontBold: "public/fonts/QmediaSans-Bold.ttf",
} as const;

/** Преимущества работы с Qmedia (адаптировано из референса под SEO-КП). */
export const ADVANTAGES: { title: string; text: string }[] = [
  {
    title: "Стратегия, а не разовые работы",
    text: "Выстраиваем системное продвижение по понятным направлениям и целям, а не набор отдельных задач.",
  },
  {
    title: "Прозрачная отчётность",
    text: "Регулярный трекинг позиций, видимости и трафика, оперативная реакция на просадки и изменения алгоритмов.",
  },
  {
    title: "Техническая база",
    text: "Думаем о стабильности и индексации сайта на каждом этапе: скорость, разметка, редиректы, безопасность.",
  },
  {
    title: "Готовность к будущему",
    text: "Оптимизируем не только под классический поиск, но и под нейросети (GEO), голосовой поиск и новые форматы выдачи.",
  },
];
