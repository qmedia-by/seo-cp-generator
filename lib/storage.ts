// Хранилище КП в Postgres (Neon/Supabase): таблица proposals(id, created_at, data jsonb).

import { calculateSchedule, normalizeActiveMonths } from "./calc";
import {
  DEFAULT_CALC_CONFIG,
  findCurrency,
  resolveCurrency,
  type CalcConfig,
} from "./calc-config";
import { ensureSchema, getPool } from "./db";
import { DEFAULT_CURRENCY } from "./seo-config";
import type { CreateProposalPayload } from "./validation";
import type { DirectionSelection, Proposal } from "./types";

/** id состоит только из hex/дефисов (как у crypto.randomUUID). Некорректный → «не найдено». */
const ID_RE = /^[a-f0-9-]{8,64}$/i;

/**
 * Валюта КП должна быть в текущих настройках: пересчитать КП молча в другой
 * валюте нельзя — цифры поменяли бы смысл. JSON, сохранённый до выбора валюты,
 * валюты не несёт — тогда всё считалось в `DEFAULT_CURRENCY`.
 * Возвращает текст ошибки для ответа API или `null`, если всё в порядке.
 */
export function proposalCurrencyError(
  payload: CreateProposalPayload,
  config: CalcConfig,
): string | null {
  const name = payload.input.currency ?? DEFAULT_CURRENCY;
  return findCurrency(config, name)
    ? null
    : `Валюта «${name}» не настроена — добавьте её в «Настройки → Данные для расчёта» или выберите другую.`;
}

/**
 * Собрать Proposal из входных данных: посчитать снимок расчёта, выдать id и дату.
 * `config` — актуальные настройки расчёта (`getCalcConfig()`); они же кладутся
 * в КП снимком, чтобы позднейшая правка настроек не меняла это КП.
 */
export function buildProposal(
  payload: CreateProposalPayload,
  config: CalcConfig = DEFAULT_CALC_CONFIG,
): Proposal {
  // Нормализуем направления в новый формат (activeMonths) — в т.ч. из старого
  // `included` при импорте ранее сохранённого JSON.
  const directions: DirectionSelection[] = payload.directions.map((d) => ({
    key: d.key,
    name: d.name,
    goal: d.goal,
    activeMonths: normalizeActiveMonths(d, payload.input.durationMonths),
    works: d.works,
  }));
  // Валюта в КП всегда явная и в написании из настроек («usd» → «USD»):
  // у старого JSON её нет, а снимок должен читаться без догадок.
  const input = {
    ...payload.input,
    currency: resolveCurrency(config, payload.input.currency).name,
  };
  const calcSnapshot = calculateSchedule(input, directions, config);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    directions,
    meta: payload.meta,
    manager: payload.manager,
    projectManager: payload.projectManager,
    calcSnapshot,
    calcConfig: config,
  };
}

export async function saveProposal(proposal: Proposal): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO proposals (id, created_at, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (id) DO UPDATE
       SET created_at = EXCLUDED.created_at, data = EXCLUDED.data`,
    [proposal.id, proposal.createdAt, JSON.stringify(proposal)],
  );
}

export async function getProposal(id: string): Promise<Proposal | null> {
  if (!ID_RE.test(id)) return null;
  await ensureSchema();
  const res = await getPool().query<{ data: Proposal }>(
    `SELECT data FROM proposals WHERE id = $1`,
    [id],
  );
  return res.rows[0]?.data ?? null;
}

export async function deleteProposal(id: string): Promise<boolean> {
  if (!ID_RE.test(id)) return false;
  await ensureSchema();
  const res = await getPool().query(`DELETE FROM proposals WHERE id = $1`, [id]);
  return (res.rowCount ?? 0) > 0;
}

/** Краткая карточка КП для списка. */
export interface ProposalSummary {
  id: string;
  createdAt: string;
  siteName: string;
  region: string;
  durationMonths: number;
  monthlyTotalPrice: number;
  totalPrice: number;
  currency: string;
  decimals: number;
  includedCount: number;
}

function toSummary(p: Proposal): ProposalSummary {
  const duration = p.input.durationMonths;
  const totalPrice = p.calcSnapshot.totalPrice;
  return {
    id: p.id,
    createdAt: p.createdAt,
    siteName: p.input.siteName,
    region: p.input.region,
    durationMonths: duration,
    // Помесячная стоимость варьируется — в карточке списка показываем среднюю.
    monthlyTotalPrice: duration > 0 ? Math.round(totalPrice / duration) : 0,
    totalPrice,
    currency: p.calcSnapshot.currency,
    // В снимках КП до появления валют разрядности нет — там всё было до сотых.
    decimals: p.calcSnapshot.decimals ?? 2,
    includedCount: p.directions.filter(
      (d) => normalizeActiveMonths(d, duration).length > 0,
    ).length,
  };
}

export async function listProposals(): Promise<ProposalSummary[]> {
  await ensureSchema();
  const res = await getPool().query<{ data: Proposal }>(
    `SELECT data FROM proposals ORDER BY created_at DESC`,
  );
  return res.rows.map((r) => toSummary(r.data));
}
