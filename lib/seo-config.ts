// Конфигурация расчёта стоимости SEO — единственный источник истины.
// Все числа выверены по `sources/Расчет SEO.xlsx`.
//
// ВАЖНО: значение коэффициента «до 500» в исходном Excel отсутствует и задано
// здесь как допущение (1.1, между «до 50»=1.0 и «до 1000»=1.2). Меняется тут.

import type {
  Audience,
  Competition,
  CoefficientKey,
  DirectionKey,
  Errors,
  Experience,
  LinkBuilding,
  Pages,
  Region,
} from "./types";

/** Базовая стоимость SEO (E1) и стоимость часа (E2) из Excel. */
export const BASE_COST = 750;
export const HOUR_RATE = 75;
export const CURRENCY = "BYN";

/** Коэффициент направления (E3..E7). */
export const DIRECTION_COEF: Record<DirectionKey, number> = {
  commercial: 1.4,
  info: 1.4,
  geo: 1.2,
  serm: 1.0,
  support: 0.6,
};

/** Человекочитаемые названия направлений. */
export const DIRECTION_NAME: Record<DirectionKey, string> = {
  commercial: "Коммерческое SEO",
  info: "Информационное SEO",
  geo: "GEO",
  serm: "SERM",
  support: "Техническая поддержка",
};

/** Порядок направлений для отображения. */
export const DIRECTION_ORDER: DirectionKey[] = [
  "commercial",
  "info",
  "geo",
  "serm",
  "support",
];

/**
 * Какие коэффициенты входят в формулу каждого направления.
 * Коммерческое/GEO — все; Информационное/SERM — без страниц/ошибок/конкуренции;
 * Техподдержка — только страницы/ошибки/опыт.
 */
export const DIRECTION_COEFFICIENTS: Record<DirectionKey, CoefficientKey[]> = {
  commercial: [
    "region",
    "audience",
    "pages",
    "errors",
    "experience",
    "linkBuilding",
    "competition",
  ],
  info: ["region", "audience", "experience", "linkBuilding"],
  geo: [
    "region",
    "audience",
    "pages",
    "errors",
    "experience",
    "linkBuilding",
    "competition",
  ],
  serm: ["region", "audience", "experience", "linkBuilding"],
  support: ["pages", "errors", "experience"],
};

// --- Таблицы коэффициентов (VLOOKUP-таблицы из Excel) ---

export const REGION_COEF: Record<Region, number> = {
  Минск: 1.0,
  "Область РБ": 0.9,
  "Вся РБ": 1.1,
  Россия: 1.5,
  "Другой регион": 1.5,
};

export const AUDIENCE_COEF: Record<Audience, number> = {
  b2b: 1.0,
  b2c: 1.0,
  все: 1.1,
};

export const PAGES_COEF: Record<Pages, number> = {
  "до 10": 0.9,
  "до 50": 1.0,
  "до 500": 1.1, // допущение (нет в Excel)
  "до 1000": 1.2,
  "до 10000": 1.4,
  "больше 10000": 1.6,
};

export const ERRORS_COEF: Record<Errors, number> = {
  Единичные: 1.0,
  Множественные: 1.2,
};

export const EXPERIENCE_COEF: Record<Experience, number> = {
  "Не было": 1.2,
  Разово: 1.1,
  "Сайт продвигался": 1.0,
};

export const LINK_BUILDING_COEF: Record<LinkBuilding, number> = {
  Базово: 1.0,
  Активно: 1.1,
  Приоритетно: 1.3,
};

export const COMPETITION_COEF: Record<Competition, number> = {
  Минимальная: 1.0,
  Средняя: 1.1,
  Высокая: 1.2,
  "Очень высокая": 1.4,
};

// --- Списки опций для форм (порядок важен для UI) ---

export const REGION_OPTIONS = Object.keys(REGION_COEF) as Region[];
export const AUDIENCE_OPTIONS = Object.keys(AUDIENCE_COEF) as Audience[];
export const PAGES_OPTIONS = Object.keys(PAGES_COEF) as Pages[];
export const ERRORS_OPTIONS = Object.keys(ERRORS_COEF) as Errors[];
export const EXPERIENCE_OPTIONS = Object.keys(EXPERIENCE_COEF) as Experience[];
export const LINK_BUILDING_OPTIONS = Object.keys(
  LINK_BUILDING_COEF,
) as LinkBuilding[];
export const COMPETITION_OPTIONS = Object.keys(
  COMPETITION_COEF,
) as Competition[];
export const PROMOTE_TYPE_OPTIONS = ["товары", "услуги", "другое"] as const;
export const DURATION_OPTIONS = [3, 6] as const;
