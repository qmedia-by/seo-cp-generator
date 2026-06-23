// Файловое хранилище КП: каждый КП — отдельный JSON в data/proposals/<id>.json.

import { promises as fs } from "node:fs";
import path from "node:path";
import { calculate } from "./calc";
import type { CreateProposalPayload } from "./validation";
import type { Proposal } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "proposals");

/** id состоит только из hex/дефисов (как у crypto.randomUUID) — защита от path traversal. */
const ID_RE = /^[a-f0-9-]{8,64}$/i;

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function fileFor(id: string): string {
  if (!ID_RE.test(id)) throw new Error("Некорректный id");
  return path.join(DATA_DIR, `${id}.json`);
}

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
  await ensureDir();
  await fs.writeFile(
    fileFor(proposal.id),
    JSON.stringify(proposal, null, 2),
    "utf-8",
  );
}

export async function getProposal(id: string): Promise<Proposal | null> {
  try {
    const raw = await fs.readFile(fileFor(id), "utf-8");
    return JSON.parse(raw) as Proposal;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function deleteProposal(id: string): Promise<boolean> {
  try {
    await fs.unlink(fileFor(id));
    return true;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw err;
  }
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
  await ensureDir();
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const items = await Promise.all(
    files.map(async (f) => {
      try {
        const raw = await fs.readFile(path.join(DATA_DIR, f), "utf-8");
        return toSummary(JSON.parse(raw) as Proposal);
      } catch {
        return null;
      }
    }),
  );
  return items
    .filter((x): x is ProposalSummary => x !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
