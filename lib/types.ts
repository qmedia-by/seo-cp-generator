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

/** Выбор по направлению: в какие месяцы активно и какие работы оставлены. */
export interface DirectionSelection {
  key: DirectionKey;
  name: string;
  /** Подзаголовок-цель (курсивная строка из разбивки работ). */
  goal: string;
  /**
   * Номера месяцев (1-based), в которые направление активно. `[]` — не входит.
   * Производное «включено» = `activeMonths.length > 0`.
   */
  activeMonths: number[];
  works: WorkItem[];
}

/** Необязательные данные о клиенте. */
export interface ProposalMeta {
  clientName?: string;
  clientEmail?: string;
  notes?: string;
}

/** Контакты менеджера, которые попадают в КП (обложка PDF и слайд контактов). */
export interface ProposalManager {
  /** Имя Фамилия. */
  name: string;
  /** Специальность («IT Account-менеджер Qmedia»). */
  role: string;
  phone: string;
  email: string;
  /** Личная страница на qmedia.by («Смотреть резюме» на слайде PM). */
  resumeUrl?: string;
  /**
   * id менеджера в справочнике — **только чтобы найти фото** в таблице
   * `manager_photos` при рендере PDF (см. lib/pdf/photos.ts). Данные менеджера
   * при этом остаются снимком: правка справочника их не меняет. Нет id —
   * контакты введены вручную, фото не будет.
   */
  id?: string;
}

/** Менеджер из справочника настроек (тот же набор полей + идентификатор). */
export interface Manager extends ProposalManager {
  id: string;
  /** Ссылка на резюме; с сайта приезжает как адрес вокруг аватарки. */
  resumeUrl: string;
  /**
   * Отпечаток загруженного фото; нет фото — поля нет. Значение **производное**:
   * в jsonb со справочником не сохраняется, а подставляется при чтении из
   * таблицы `manager_photos` (сами байты лежат там, см. lib/manager-photos.ts).
   * Нужно для двух вещей: показать «фото есть» и сбросить кэш браузера, когда
   * картинку заменили (адрес фото — со штампом версии).
   */
  photoVersion?: string;
}

/** Результат расчёта по одному направлению. */
export interface DirectionCalc {
  key: DirectionKey;
  name: string;
  included: boolean;
  /** Полная стоимость за месяц до скидки (BYN). 0 — если выключено. */
  fullMonthlyPrice: number;
  /** Доля пакетной скидки 0..1 (например 0.3). 0 — скидки нет. */
  discountRate: number;
  /** Итоговая стоимость за месяц со скидкой (BYN). 0 — если выключено. */
  monthlyPrice: number;
  /** Часов в месяц (по итоговой цене со скидкой). */
  monthlyHours: number;
}

/** Полный результат расчёта одного месяца. */
export interface CalcResult {
  currency: string;
  durationMonths: DurationMonths;
  perDirection: DirectionCalc[];
  /** Итог за месяц по включённым направлениям (со скидками). */
  monthlyTotalPrice: number;
  monthlyTotalHours: number;
  /** Итог за месяц без учёта скидок (для показа экономии). */
  monthlyTotalFullPrice: number;
  /** Сумма скидки за месяц = monthlyTotalFullPrice − monthlyTotalPrice. */
  monthlyDiscount: number;
  /** Итог за весь срок = месячный × durationMonths. */
  totalPrice: number;
  totalHours: number;
}

/** Расчёт одного месяца внутри помесячного графика. */
export interface MonthBreakdown {
  /** Номер месяца, 1-based. */
  month: number;
  /** Состояние всех направлений в этом месяце (включая выключенные). */
  perDirection: DirectionCalc[];
  monthlyTotalPrice: number;
  monthlyTotalHours: number;
  monthlyTotalFullPrice: number;
  monthlyDiscount: number;
}

/** Итог по одному направлению за весь срок (сумма по активным месяцам). */
export interface DirectionScheduleCalc {
  key: DirectionKey;
  name: string;
  /** Месяцы (1-based), в которые направление активно. */
  activeMonths: number[];
  /** Человекочитаемая подпись: «все 6 месяцев» / «мес. 1–2» / «—». */
  monthsLabel: string;
  /**
   * Цена за один месяц по каждому активному месяцу (в порядке `activeMonths`).
   * Значения могут различаться: пакетная скидка действует только в те месяцы,
   * где активно Коммерческое SEO. Нужны, чтобы в КП показывать помесячный
   * платёж вместо пугающей суммы за срок.
   */
  pricePerMonth: number[];
  /** То же до пакетной скидки. */
  fullPricePerMonth: number[];
  /** Часы за один месяц по каждому активному месяцу. */
  hoursPerMonth: number[];
  /** Стоимость за срок (сумма monthlyPrice по активным месяцам, со скидками). */
  totalPrice: number;
  /** Полная стоимость за срок до скидок. */
  totalFullPrice: number;
  /** Часы за срок. */
  totalHours: number;
}

/** Полный результат расчёта с учётом помесячного графика. */
export interface ScheduleResult {
  currency: string;
  durationMonths: DurationMonths;
  /** Помесячная разбивка (длина = durationMonths). */
  months: MonthBreakdown[];
  /** Итоги по направлениям за срок (для матрицы и пометок). */
  perDirection: DirectionScheduleCalc[];
  /** Итог за весь срок (сумма помесячных итогов). */
  totalPrice: number;
  totalHours: number;
  /** Полная стоимость за срок без скидок. */
  totalFullPrice: number;
  /** Сумма скидки за срок = totalFullPrice − totalPrice. */
  totalDiscount: number;
}

/** Сохраняемое на сервере коммерческое предложение. */
export interface Proposal {
  id: string;
  createdAt: string; // ISO
  input: ProposalInput;
  directions: DirectionSelection[];
  meta?: ProposalMeta;
  /**
   * Менеджер, подготовивший КП. Визард требует его обязательно; поле осталось
   * необязательным ради старых КП и импорта их JSON — там берутся контакты
   * по умолчанию (COMPANY.manager).
   */
  manager?: ProposalManager;
  /**
   * Project-менеджер проекта — отдельный слайд PDF. Выбирается из того же
   * справочника, что и `manager`, но **независимо**: КП часто готовит продавец,
   * а ведёт проект другой человек. В визарде тоже обязателен; нет (старое КП) —
   * слайд PM показывает контакт по умолчанию.
   */
  projectManager?: ProposalManager;
  /** Снимок расчёта на момент сохранения (для истории). */
  calcSnapshot: ScheduleResult;
  /**
   * Снимок настроек расчёта на момент сохранения. PDF/Excel пересчитывают КП
   * именно по нему, поэтому правка настроек не меняет уже отправленные КП.
   * Нет (старые КП) — берутся значения по умолчанию из `DEFAULT_CALC_CONFIG`.
   * Типизирован как `unknown`, чтобы `types.ts` не зависел от `calc-config.ts`;
   * потребители пропускают через `mergeCalcConfig`.
   */
  calcConfig?: unknown;
}
