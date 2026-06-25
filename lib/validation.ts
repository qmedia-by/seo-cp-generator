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

const asEnum = <T extends string>(values: readonly T[]) =>
  z.enum(values as unknown as [T, ...T[]]);

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
  text: z.string().trim().min(1).max(1000),
  custom: z.boolean().optional(),
});

const directionSchema = z
  .object({
    key: z.enum(["commercial", "info", "geo", "serm", "support"]),
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

/** Тело запроса на создание/импорт КП (id/createdAt/calc считаются на сервере). */
export const createProposalSchema = z.object({
  input: inputSchema,
  directions: z.array(directionSchema).min(1).max(5),
  meta: metaSchema.optional(),
});

export type CreateProposalPayload = z.infer<typeof createProposalSchema>;
