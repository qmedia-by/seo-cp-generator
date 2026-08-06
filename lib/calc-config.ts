// Настраиваемые параметры расчёта (то, что раньше было константами в `seo-config.ts`).
//
// `DEFAULT_CALC_CONFIG` — значения по умолчанию, выверенные по `sources/Расчет SEO.xlsx`
// (их же использует золотой тест). Актуальные значения администратор правит в разделе
// «Настройки → Данные для расчёта»; они лежат в БД (`app_settings`, ключ `calc`) —
// см. `lib/settings.ts`. Каждое сохранённое КП хранит снимок конфига (`Proposal.calcConfig`),
// поэтому PDF/Excel уже отправленного КП не меняются после правки настроек.
//
// Что НЕ настраивается (зашито в типах и формулах): валюта (BYN), варианты срока (3/6 мес),
// сами наборы опций (список регионов, вариантов страниц и т.д.) и правила округления.

import {
  AUDIENCE_COEF,
  AUDIENCE_OPTIONS,
  BASE_COST,
  COMMERCIAL_BUNDLE,
  COMPETITION_COEF,
  COMPETITION_OPTIONS,
  DIRECTION_COEF,
  DIRECTION_COEFFICIENTS,
  DIRECTION_ORDER,
  ERRORS_COEF,
  ERRORS_OPTIONS,
  EXPERIENCE_COEF,
  EXPERIENCE_OPTIONS,
  HOUR_RATE,
  LINK_BUILDING_COEF,
  LINK_BUILDING_OPTIONS,
  PAGES_COEF,
  PAGES_OPTIONS,
  REGION_COEF,
  REGION_OPTIONS,
} from "./seo-config";
import type {
  Audience,
  CoefficientKey,
  Competition,
  DirectionKey,
  Errors,
  Experience,
  LinkBuilding,
  Pages,
  Region,
} from "./types";

/** Таблицы коэффициентов параметров проекта (ключ = поле `ProposalInput`). */
export interface CoefTables {
  region: Record<Region, number>;
  audience: Record<Audience, number>;
  pages: Record<Pages, number>;
  errors: Record<Errors, number>;
  experience: Record<Experience, number>;
  linkBuilding: Record<LinkBuilding, number>;
  competition: Record<Competition, number>;
}

/** Настройка пакетной скидки: направление-триггер → скидка для перечисленных. */
export interface BundleConfig {
  trigger: DirectionKey;
  discounted: DirectionKey[];
  /** Доля скидки 0..1 (0.3 = 30%). */
  rate: number;
}

/** Полный набор настраиваемых величин расчёта. */
export interface CalcConfig {
  /** Базовая стоимость SEO за месяц (BYN), от неё считается каждое направление. */
  baseCost: number;
  /** Стоимость часа работ (BYN) — из неё считается объём часов. */
  hourRate: number;
  /** Множитель направления. */
  directionCoef: Record<DirectionKey, number>;
  /** Какие коэффициенты параметров входят в формулу направления. */
  directionCoefficients: Record<DirectionKey, CoefficientKey[]>;
  bundle: BundleConfig;
  coef: CoefTables;
}

export const DEFAULT_CALC_CONFIG: CalcConfig = {
  baseCost: BASE_COST,
  hourRate: HOUR_RATE,
  directionCoef: { ...DIRECTION_COEF },
  directionCoefficients: {
    commercial: [...DIRECTION_COEFFICIENTS.commercial],
    info: [...DIRECTION_COEFFICIENTS.info],
    geo: [...DIRECTION_COEFFICIENTS.geo],
    serm: [...DIRECTION_COEFFICIENTS.serm],
    support: [...DIRECTION_COEFFICIENTS.support],
  },
  bundle: {
    trigger: COMMERCIAL_BUNDLE.trigger,
    discounted: [...COMMERCIAL_BUNDLE.discounted],
    rate: COMMERCIAL_BUNDLE.rate,
  },
  coef: {
    region: { ...REGION_COEF },
    audience: { ...AUDIENCE_COEF },
    pages: { ...PAGES_COEF },
    errors: { ...ERRORS_COEF },
    experience: { ...EXPERIENCE_COEF },
    linkBuilding: { ...LINK_BUILDING_COEF },
    competition: { ...COMPETITION_COEF },
  },
};

/** Глубокая копия — чтобы правки черновика не задевали дефолты/снимки. */
export function cloneCalcConfig(cfg: CalcConfig): CalcConfig {
  return {
    baseCost: cfg.baseCost,
    hourRate: cfg.hourRate,
    directionCoef: { ...cfg.directionCoef },
    directionCoefficients: Object.fromEntries(
      DIRECTION_KEYS.map((k) => [k, [...cfg.directionCoefficients[k]]]),
    ) as Record<DirectionKey, CoefficientKey[]>,
    bundle: { ...cfg.bundle, discounted: [...cfg.bundle.discounted] },
    coef: Object.fromEntries(
      COEF_GROUPS.map((g) => [g.key, { ...cfg.coef[g.key] }]),
    ) as unknown as CoefTables,
  };
}

// --- Метаданные для интерфейса настроек ---

/** Порядок направлений — тот же, что в остальном приложении. */
const DIRECTION_KEYS = DIRECTION_ORDER;

/**
 * Описание таблиц коэффициентов: подписи и пояснения для формы настроек.
 * `short` — узкая подпись для матрицы «направление × коэффициент».
 */
export const COEF_GROUPS: {
  key: CoefficientKey;
  short: string;
  title: string;
  hint: string;
  options: readonly string[];
}[] = [
  {
    key: "region",
    short: "Регион",
    title: "Регион продвижения",
    hint: "Чем шире и конкурентнее география, тем больше работы: множитель по полю «Регион продвижения» из параметров проекта.",
    options: REGION_OPTIONS,
  },
  {
    key: "audience",
    short: "Для кого",
    title: "Для кого (аудитория)",
    hint: "Множитель по полю «Для кого». Работа сразу на b2b и b2c требует двух семантических ядер — отсюда надбавка для «все».",
    options: AUDIENCE_OPTIONS,
  },
  {
    key: "pages",
    short: "Страницы",
    title: "Количество страниц",
    hint: "Объём сайта: множитель по полю «Количество страниц». Значение для «до 500» в исходном Excel отсутствовало и задано как допущение.",
    options: PAGES_OPTIONS,
  },
  {
    key: "errors",
    short: "Ошибки",
    title: "Наличие ошибок",
    hint: "Множитель по полю «Наличие ошибок»: множественные технические проблемы требуют больше работ по исправлению.",
    options: ERRORS_OPTIONS,
  },
  {
    key: "experience",
    short: "Опыт",
    title: "Предыдущий опыт SEO",
    hint: "Множитель по полю «Предыдущий опыт SEO»: сайт без истории продвижения дороже — базу приходится создавать с нуля.",
    options: EXPERIENCE_OPTIONS,
  },
  {
    key: "linkBuilding",
    short: "Ссылки",
    title: "Ссылочное продвижение",
    hint: "Множитель по полю «Ссылочное продвижение»: интенсивность работы с внешними ссылками.",
    options: LINK_BUILDING_OPTIONS,
  },
  {
    key: "competition",
    short: "Конкуренция",
    title: "Конкуренция",
    hint: "Множитель по полю «Конкуренция»: чем сильнее конкуренты в выдаче, тем больше требуется работ.",
    options: COMPETITION_OPTIONS,
  },
];

// --- Чтение «сырых» данных из БД ---

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Положительное конечное число либо `fallback`. */
function num(raw: unknown, fallback: number): number {
  const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : raw;
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : fallback;
}

/**
 * Привести произвольный объект из БД к валидному `CalcConfig`: неизвестные и
 * битые значения заменяются дефолтами. Так старый/частичный JSON в `app_settings`
 * (или в снимке КП) не ломает расчёт, а новые поля конфига получают значения
 * по умолчанию без миграции.
 */
export function mergeCalcConfig(raw: unknown): CalcConfig {
  const d = DEFAULT_CALC_CONFIG;
  if (!isRecord(raw)) return cloneCalcConfig(d);

  const rawDirCoef = isRecord(raw.directionCoef) ? raw.directionCoef : {};
  const rawDirCoefs = isRecord(raw.directionCoefficients)
    ? raw.directionCoefficients
    : {};
  const rawBundle = isRecord(raw.bundle) ? raw.bundle : {};
  const rawCoef = isRecord(raw.coef) ? raw.coef : {};

  const coefKeys = COEF_GROUPS.map((g) => g.key);

  return {
    baseCost: num(raw.baseCost, d.baseCost),
    hourRate: num(raw.hourRate, d.hourRate),
    directionCoef: Object.fromEntries(
      DIRECTION_KEYS.map((k) => [k, num(rawDirCoef[k], d.directionCoef[k])]),
    ) as Record<DirectionKey, number>,
    directionCoefficients: Object.fromEntries(
      DIRECTION_KEYS.map((k) => {
        const list = rawDirCoefs[k];
        if (!Array.isArray(list)) return [k, [...d.directionCoefficients[k]]];
        // Сохраняем канонический порядок коэффициентов, а не порядок из JSON.
        const set = new Set(list);
        return [k, coefKeys.filter((c) => set.has(c))];
      }),
    ) as Record<DirectionKey, CoefficientKey[]>,
    bundle: {
      trigger: DIRECTION_KEYS.includes(rawBundle.trigger as DirectionKey)
        ? (rawBundle.trigger as DirectionKey)
        : d.bundle.trigger,
      discounted: Array.isArray(rawBundle.discounted)
        ? DIRECTION_KEYS.filter((k) =>
            (rawBundle.discounted as unknown[]).includes(k),
          )
        : [...d.bundle.discounted],
      // Скидка — единственное значение, где 0 допустим (скидки нет).
      rate: rateOrDefault(rawBundle.rate, d.bundle.rate),
    },
    coef: Object.fromEntries(
      COEF_GROUPS.map((g) => {
        const table = isRecord(rawCoef[g.key]) ? rawCoef[g.key] : {};
        const defaults = d.coef[g.key] as Record<string, number>;
        return [
          g.key,
          Object.fromEntries(
            g.options.map((o) => [
              o,
              num((table as Record<string, unknown>)[o], defaults[o]),
            ]),
          ),
        ];
      }),
    ) as unknown as CoefTables,
  };
}

function rateOrDefault(raw: unknown, fallback: number): number {
  const n = typeof raw === "string" ? Number(raw.replace(",", ".")) : raw;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n >= 1) {
    return fallback;
  }
  return n;
}
