// Доменные типы генератора КП по SEO.
// Значения-литералы умышленно совпадают со значениями из `Расчет SEO.xlsx`,
// чтобы расчёт и выгрузка в Excel были «зеркальны» исходнику.

export type Region =
  | "Минск"
  | "Область РБ"
  | "Вся РБ"
  | "Россия"
  | "Другой регион";

export type Audience = "b2b" | "b2c" | "все";

export type PromoteType = "товары" | "услуги" | "другое";

export type Pages =
  | "до 10"
  | "до 50"
  | "до 500"
  | "до 1000"
  | "до 10000"
  | "больше 10000";

export type Experience = "Не было" | "Разово" | "Сайт продвигался";

export type Errors = "Единичные" | "Множественные";

export type LinkBuilding = "Базово" | "Активно" | "Приоритетно";

export type Competition =
  | "Минимальная"
  | "Средняя"
  | "Высокая"
  | "Очень высокая";

export type DurationMonths = 3 | 6;

export type DirectionKey = "commercial" | "info" | "geo" | "serm" | "support";

/** Какие коэффициенты участвуют в формуле направления (см. Расчет SEO.xlsx). */
export type CoefficientKey =
  | "region"
  | "audience"
  | "pages"
  | "errors"
  | "experience"
  | "linkBuilding"
  | "competition";

/** Введённые пользователем параметры проекта. */
export interface ProposalInput {
  siteName: string;
  region: Region;
  durationMonths: DurationMonths;
  audience: Audience;
  promoteType: PromoteType;
  pages: Pages;
  experience: Experience;
  errors: Errors;
  linkBuilding: LinkBuilding;
  competition: Competition;
}

/** Один пункт работ внутри направления. */
export interface WorkItem {
  text: string;
  /** true — добавлен пользователем вручную (кастомный). */
  custom?: boolean;
}

/** Выбор по направлению: включено ли и какие работы оставлены. */
export interface DirectionSelection {
  key: DirectionKey;
  name: string;
  /** Подзаголовок-цель (курсивная строка из разбивки работ). */
  goal: string;
  included: boolean;
  works: WorkItem[];
}

/** Необязательные данные о клиенте. */
export interface ProposalMeta {
  clientName?: string;
  clientEmail?: string;
  notes?: string;
}

/** Результат расчёта по одному направлению. */
export interface DirectionCalc {
  key: DirectionKey;
  name: string;
  included: boolean;
  /** Стоимость за месяц (BYN). 0 — если направление выключено. */
  monthlyPrice: number;
  /** Часов в месяц. */
  monthlyHours: number;
}

/** Полный результат расчёта. */
export interface CalcResult {
  currency: string;
  durationMonths: DurationMonths;
  perDirection: DirectionCalc[];
  /** Итог за месяц по включённым направлениям. */
  monthlyTotalPrice: number;
  monthlyTotalHours: number;
  /** Итог за весь срок = месячный × durationMonths. */
  totalPrice: number;
  totalHours: number;
}

/** Сохраняемое на сервере коммерческое предложение. */
export interface Proposal {
  id: string;
  createdAt: string; // ISO
  input: ProposalInput;
  directions: DirectionSelection[];
  meta?: ProposalMeta;
  /** Снимок расчёта на момент сохранения (для истории). */
  calcSnapshot: CalcResult;
}
