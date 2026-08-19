// Валидация входных данных API через zod.

import { z } from "zod";
import {
  AUDIENCE_OPTIONS,
  COMPETITION_OPTIONS,
  ERRORS_OPTIONS,
  EXPERIENCE_OPTIONS,
  LINK_BUILDING_OPTIONS,
  PAGES_OPTIONS,
  PROMOTE_TYPE_OPTIONS,
  REGION_OPTIONS,
} from "./seo-config";
import { MAX_WORKS_PER_DIRECTION, MAX_WORK_LENGTH } from "./works-config";

const asEnum = <T extends string>(values: readonly T[]) =>
  z.enum(values as unknown as [T, ...T[]]);

const directionKeySchema = z.enum([
  "commercial",
  "info",
  "geo",
  "serm",
  "support",
]);

const coefficientKeySchema = z.enum([
  "region",
  "audience",
  "pages",
  "errors",
  "experience",
  "linkBuilding",
  "competition",
]);

export const inputSchema = z.object({
  siteName: z.string().trim().min(1, "Укажите название сайта").max(200),
  region: asEnum(REGION_OPTIONS),
  durationMonths: z.union([z.literal(3), z.literal(6)]),
  audience: asEnum(AUDIENCE_OPTIONS),
  promoteType: asEnum(PROMOTE_TYPE_OPTIONS),
  pages: asEnum(PAGES_OPTIONS),
  experience: asEnum(EXPERIENCE_OPTIONS),
  errors: asEnum(ERRORS_OPTIONS),
  linkBuilding: asEnum(LINK_BUILDING_OPTIONS),
  competition: asEnum(COMPETITION_OPTIONS),
});

const workItemSchema = z.object({
  text: z.string().trim().min(1).max(MAX_WORK_LENGTH),
  custom: z.boolean().optional(),
});

const directionSchema = z
  .object({
    key: directionKeySchema,
    name: z.string(),
    goal: z.string(),
    // Новый формат: помесячный набор активных месяцев.
    activeMonths: z.array(z.number().int().min(1).max(12)).optional(),
    // Старый формат — для обратной совместимости при импорте сохранённого JSON.
    included: z.boolean().optional(),
    works: z.array(workItemSchema),
  })
  .refine((d) => d.activeMonths !== undefined || d.included !== undefined, {
    message: "Нужно указать activeMonths или included",
    path: ["activeMonths"],
  });

const metaSchema = z.object({
  clientName: z.string().trim().max(200).optional(),
  clientEmail: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(5000).optional(),
});

/** Ссылка на резюме: только http(s) и только с сайта компании — или пусто. */
const resumeUrlSchema = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), {
    message: "Ссылка должна начинаться с http:// или https://",
  })
  .default("");

/** Контакты менеджера в КП. Обязательно только имя — остальное можно не заполнять. */
export const proposalManagerSchema = z.object({
  name: z.string().trim().min(1, "Укажите имя и фамилию").max(120),
  role: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(60).default(""),
  email: z.string().trim().max(120).default(""),
  resumeUrl: resumeUrlSchema,
  // id справочника — ссылка на фото при рендере PDF, не обязателен.
  id: z.string().trim().max(64).optional(),
});

/**
 * Менеджер в справочнике настроек. `photoVersion` сюда не входит намеренно:
 * это производное поле (отпечаток фото из таблицы `manager_photos`), и zod
 * молча его отбросит — фото меняется своей ручкой, а не сохранением списка.
 */
export const managerSchema = proposalManagerSchema.extend({
  id: z.string().trim().min(1).max(64),
});

export const managersSchema = z.array(managerSchema).max(50);

/** Тело запроса на создание/импорт КП (id/createdAt/calc считаются на сервере). */
export const createProposalSchema = z.object({
  input: inputSchema,
  directions: z.array(directionSchema).min(1).max(5),
  meta: metaSchema.optional(),
  manager: proposalManagerSchema.optional(),
  projectManager: proposalManagerSchema.optional(),
});

export type CreateProposalPayload = z.infer<typeof createProposalSchema>;

// --- Настройки расчёта ---

const positiveNumber = z
  .number({ invalid_type_error: "Нужно число" })
  .finite()
  .positive("Значение должно быть больше нуля");

/** Коэффициент: положительное число в разумных пределах. */
const coefNumber = positiveNumber.max(1000);
/** Денежная величина (базовая стоимость, ставка часа). */
const priceNumber = positiveNumber.max(1_000_000);

/** Таблица «вариант → коэффициент»: требуются все варианты из списка опций. */
const coefTableSchema = <T extends string>(values: readonly T[]) =>
  z.object(
    Object.fromEntries(values.map((v) => [v, coefNumber])) as Record<
      T,
      typeof coefNumber
    >,
  );

const directionRecord = <S extends z.ZodTypeAny>(value: S) =>
  z.object({
    commercial: value,
    info: value,
    geo: value,
    serm: value,
    support: value,
  });

/** Списки работ по направлениям (настройка «Работы направлений»). */
export const worksConfigSchema = directionRecord(
  z
    .array(z.string().trim().min(1, "Работа не может быть пустой").max(MAX_WORK_LENGTH))
    .max(MAX_WORKS_PER_DIRECTION),
);

export const calcConfigSchema = z.object({
  baseCost: priceNumber,
  hourRate: priceNumber,
  directionCoef: directionRecord(coefNumber),
  directionCoefficients: directionRecord(z.array(coefficientKeySchema)),
  bundle: z.object({
    trigger: directionKeySchema,
    discounted: z.array(directionKeySchema),
    rate: z
      .number({ invalid_type_error: "Нужно число" })
      .min(0, "Скидка не может быть отрицательной")
      .lt(1, "Скидка должна быть меньше 100%"),
  }),
  coef: z.object({
    region: coefTableSchema(REGION_OPTIONS),
    audience: coefTableSchema(AUDIENCE_OPTIONS),
    pages: coefTableSchema(PAGES_OPTIONS),
    errors: coefTableSchema(ERRORS_OPTIONS),
    experience: coefTableSchema(EXPERIENCE_OPTIONS),
    linkBuilding: coefTableSchema(LINK_BUILDING_OPTIONS),
    competition: coefTableSchema(COMPETITION_OPTIONS),
  }),
});
