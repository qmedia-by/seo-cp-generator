// Хранилище КП в Postgres (Neon/Supabase): таблица proposals(id, created_at, data jsonb).

import { calculate } from "./calc";
import { ensureSchema, getPool } from "./db";
import type { CreateProposalPayload } from "./validation";
import type { Proposal } from "./types";

/** id состоит только из hex/дефисов (как у crypto.randomUUID). Некорректный → «не найдено». */
const ID_RE = /^[a-f0-9-]{8,64}$/i;

/** Собрать Proposal из входных данных: посчитать снимок расчёта, выдать id и дату. */
export function buildProposal(payload: CreateProposalPayload): Proposal {
  const calcSnapshot = calculate(payload.input, payload.directions);
  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    input: payload.input,
    directions: payload.directions,
    meta: payload.meta,
    calcSnapshot,
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
  includedCount: number;
}

function toSummary(p: Proposal): ProposalSummary {
  return {
    id: p.id,
    createdAt: p.createdAt,
    siteName: p.input.siteName,
    region: p.input.region,
    durationMonths: p.input.durationMonths,
    monthlyTotalPrice: p.calcSnapshot.monthlyTotalPrice,
    totalPrice: p.calcSnapshot.totalPrice,
    currency: p.calcSnapshot.currency,
    includedCount: p.directions.filter((d) => d.included).length,
  };
}

export async function listProposals(): Promise<ProposalSummary[]> {
  await ensureSchema();
  const res = await getPool().query<{ data: Proposal }>(
    `SELECT data FROM proposals ORDER BY created_at DESC`,
  );
  return res.rows.map((r) => toSummary(r.data));
}
