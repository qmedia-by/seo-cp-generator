// Настройки приложения в Postgres: таблица app_settings(key, data jsonb, updated_at).
//
// Два ключа:
//   'calc'     — параметры расчёта (`CalcConfig`), см. lib/calc-config.ts;
//   'managers' — справочник менеджеров для шага «Менеджер» в визарде.
//
// Пары функций `getX` / `getXOrDefault`: первые пробрасывают ошибку БД (нужны там,
// где по настройкам считается и сохраняется КП), вторые молча откатываются на
// значения по умолчанию — чтобы недоступная БД не роняла страницы визарда/настроек
// (сохранение всё равно упадёт с явной ошибкой).

import { mergeCalcConfig, type CalcConfig } from "./calc-config";
import { COMPANY } from "./company";
import { ensureSchema, getPool } from "./db";
import type { Manager } from "./types";

const CALC_KEY = "calc";
const MANAGERS_KEY = "managers";

/** Менеджер по умолчанию — контакт из `lib/company.ts` (как было до настроек). */
export const DEFAULT_MANAGERS: Manager[] = [
  {
    id: "default",
    name: COMPANY.manager.name,
    role: COMPANY.manager.role,
    phone: COMPANY.manager.phone,
    email: COMPANY.manager.email,
  },
];

async function readSetting(key: string): Promise<unknown> {
  await ensureSchema();
  const res = await getPool().query<{ data: unknown }>(
    `SELECT data FROM app_settings WHERE key = $1`,
    [key],
  );
  return res.rows[0]?.data ?? null;
}

async function writeSetting(key: string, value: unknown): Promise<void> {
  await ensureSchema();
  await getPool().query(
    `INSERT INTO app_settings (key, data, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE
       SET data = EXCLUDED.data, updated_at = now()`,
    [key, JSON.stringify(value)],
  );
}

// --- Параметры расчёта ---

/** Актуальный конфиг расчёта. Битые/отсутствующие поля добираются из дефолтов. */
export async function getCalcConfig(): Promise<CalcConfig> {
  return mergeCalcConfig(await readSetting(CALC_KEY));
}

export async function getCalcConfigOrDefault(): Promise<CalcConfig> {
  try {
    return await getCalcConfig();
  } catch (err) {
    console.error("Не удалось прочитать настройки расчёта:", err);
    return mergeCalcConfig(null);
  }
}

export async function saveCalcConfig(config: CalcConfig): Promise<void> {
  await writeSetting(CALC_KEY, config);
}

/** Сброс к значениям по умолчанию — просто удаляем строку настроек. */
export async function resetCalcConfig(): Promise<void> {
  await ensureSchema();
  await getPool().query(`DELETE FROM app_settings WHERE key = $1`, [CALC_KEY]);
}

// --- Справочник менеджеров ---

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.trim().slice(0, max) : "";

/** Отфильтровать мусор из jsonb: менеджер без имени бесполезен. */
function normalizeManagers(raw: unknown): Manager[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is Record<string, unknown> => typeof m === "object" && m !== null)
    .map((m, i) => ({
      id: str(m.id, 64) || `m${i}`,
      name: str(m.name, 120),
      role: str(m.role, 120),
      phone: str(m.phone, 60),
      email: str(m.email, 120),
    }))
    .filter((m) => m.name.length > 0)
    .slice(0, 50);
}

/**
 * Справочник менеджеров. Пока настройки не сохраняли ни разу (строки в БД нет),
 * отдаём одного менеджера по умолчанию — чтобы список не был пустым и КП по
 * умолчанию выглядели как раньше. Пустой массив, сохранённый явно, так и остаётся
 * пустым (`data` есть, но список пуст).
 */
export async function getManagers(): Promise<Manager[]> {
  const raw = await readSetting(MANAGERS_KEY);
  if (raw === null) return DEFAULT_MANAGERS.map((m) => ({ ...m }));
  return normalizeManagers(raw);
}

export async function getManagersOrDefault(): Promise<Manager[]> {
  try {
    return await getManagers();
  } catch (err) {
    console.error("Не удалось прочитать список менеджеров:", err);
    return DEFAULT_MANAGERS.map((m) => ({ ...m }));
  }
}

export async function saveManagers(managers: Manager[]): Promise<void> {
  await writeSetting(MANAGERS_KEY, normalizeManagers(managers));
}
