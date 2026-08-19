// Миграции схемы и данных.
//
// Раньше схему создавал `ensureSchema()` набором `CREATE TABLE IF NOT EXISTS`, а
// разовые правки данных делать было нечем. Здесь — минимальный раннер: список
// миграций с журналом применённых (`schema_migrations`), без внешних зависимостей
// и без отдельного шага деплоя (CI миграции не запускает — они прогоняются лениво
// при первом обращении к БД, см. `ensureSchema` в lib/db.ts).
//
// ПРАВИЛА
//   • Миграции неизменяемы: применённую не редактируем и не удаляем — только
//     добавляем следующую. Иначе базы разъедутся: на проде миграция уже
//     отмечена в журнале и повторно не выполнится.
//   • `id` — порядковый префикс + смысл (`0003_...`); порядок в массиве = порядок
//     применения.
//   • Каждая миграция идёт в своей транзакции; весь прогон обёрнут в advisory
//     lock, поэтому несколько инстансов приложения (или холодных стартов
//     одновременно) не выполнят одно и то же дважды.
//   • SQL пишем идемпотентным (`IF NOT EXISTS`, `ON CONFLICT`) — на случай, если
//     базу уже правили руками до появления журнала.

import type { Pool, PoolClient } from "pg";
import { DEFAULT_WORKS_CONFIG } from "./works-config";

interface Migration {
  id: string;
  run: (client: PoolClient) => Promise<void>;
}

/** Произвольное число: ключ advisory-блокировки именно этого приложения. */
const LOCK_KEY = 8_140_231;

const MIGRATIONS: Migration[] = [
  {
    // Базовая схема: то, что до появления журнала создавал ensureSchema().
    id: "0001_init",
    run: async (c) => {
      await c.query(
        `CREATE TABLE IF NOT EXISTS proposals (
           id         text PRIMARY KEY,
           created_at timestamptz NOT NULL,
           data       jsonb NOT NULL
         )`,
      );
      // Настройки приложения (ключ → jsonb): 'calc' — параметры расчёта,
      // 'works' — списки работ направлений, 'managers' — справочник менеджеров.
      // См. lib/settings.ts.
      await c.query(
        `CREATE TABLE IF NOT EXISTS app_settings (
           key        text PRIMARY KEY,
           data       jsonb NOT NULL,
           updated_at timestamptz NOT NULL DEFAULT now()
         )`,
      );
    },
  },
  {
    // Каталог работ переехал из кода в настройки: переносим списки в БД, чтобы
    // на существующих базах они не «появились» только после первого сохранения
    // через интерфейс. `ON CONFLICT DO NOTHING` — на случай, если настройку уже
    // успели сохранить руками.
    //
    // Источник данных — `DEFAULT_WORKS_CONFIG` на момент прогона миграции.
    // Дальше источник истины — БД: правки `works-catalog.ts` на уже мигрированную
    // базу не попадут (там списки правят через `/settings`).
    id: "0002_seed_works",
    run: async (c) => {
      await c.query(
        `INSERT INTO app_settings (key, data, updated_at)
         VALUES ('works', $1::jsonb, now())
         ON CONFLICT (key) DO NOTHING`,
        [JSON.stringify(DEFAULT_WORKS_CONFIG)],
      );
    },
  },
  {
    // Фото менеджеров. Отдельная таблица, а не поле в jsonb со справочником:
    // список менеджеров читается на каждый рендер визарда и уезжает в браузер
    // пропсами — картинки там были бы мёртвым грузом. `manager_id` — id из
    // справочника (`app_settings.data->'managers'`), внешнего ключа нет, потому
    // что справочник живёт в jsonb; осиротевшие строки чистит `saveManagers`.
    id: "0003_manager_photos",
    run: async (c) => {
      await c.query(
        `CREATE TABLE IF NOT EXISTS manager_photos (
           manager_id text PRIMARY KEY,
           mime       text NOT NULL,
           version    text NOT NULL,
           bytes      bytea NOT NULL,
           updated_at timestamptz NOT NULL DEFAULT now()
         )`,
      );
    },
  },
];

/** Список id — для проверки уникальности в тестах. */
export const MIGRATION_IDS: string[] = MIGRATIONS.map((m) => m.id);

/**
 * Применить недостающие миграции. Безопасно вызывать параллельно и повторно:
 * лишние вызовы просто ничего не делают.
 */
export async function runMigrations(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    // Блокировка берётся ПЕРВОЙ, до всякого DDL: `CREATE TABLE IF NOT EXISTS`
    // не атомарен, и два параллельных холодных старта роняли друг друга с
    // «duplicate key value violates unique constraint "pg_type_typname_nsp_index"»
    // (воспроизводится тестом на двух пулах). Под локом второй инстанс просто
    // ждёт и видит журнал уже заполненным.
    await client.query(`SELECT pg_advisory_lock($1)`, [LOCK_KEY]);
    try {
      await client.query(
        `CREATE TABLE IF NOT EXISTS schema_migrations (
           id         text PRIMARY KEY,
           applied_at timestamptz NOT NULL DEFAULT now()
         )`,
      );
      const applied = await client.query<{ id: string }>(
        `SELECT id FROM schema_migrations`,
      );
      const done = new Set(applied.rows.map((r) => r.id));

      for (const migration of MIGRATIONS) {
        if (done.has(migration.id)) continue;
        await client.query("BEGIN");
        try {
          await migration.run(client);
          await client.query(
            `INSERT INTO schema_migrations (id) VALUES ($1)
             ON CONFLICT (id) DO NOTHING`,
            [migration.id],
          );
          await client.query("COMMIT");
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          throw new Error(
            `Миграция ${migration.id} не применилась: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }
      }
    } finally {
      await client.query(`SELECT pg_advisory_unlock($1)`, [LOCK_KEY]);
    }
  } finally {
    client.release();
  }
}
