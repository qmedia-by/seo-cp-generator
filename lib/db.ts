// Подключение к Postgres (Neon / Supabase) для хранилища КП.
// Драйвер `pg` через строку подключения DATABASE_URL — провайдеро-независимо.

import { Pool } from "pg";

let pool: Pool | undefined;

/** Singleton-пул. На serverless важно не плодить пулы — переиспользуем один. */
export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL не задан. Укажите строку подключения к Postgres (Neon/Supabase).",
      );
    }
    // Neon/Supabase требуют TLS; для локального Postgres SSL отключаем.
    const isLocal = /@(localhost|127\.0\.0\.1)\b/.test(connectionString);
    pool = new Pool({
      connectionString,
      ssl: isLocal ? undefined : { rejectUnauthorized: false },
      // На serverless-инстансах держим пул маленьким; пулинг лучше делать
      // на стороне провайдера (используйте pooled/pooler строку подключения).
      max: 3,
    });
  }
  return pool;
}

let schemaReady: Promise<void> | undefined;

/** Идемпотентно создаёт таблицу при первом обращении (аналог прежнего ensureDir). */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool()
      .query(
        `CREATE TABLE IF NOT EXISTS proposals (
           id         text PRIMARY KEY,
           created_at timestamptz NOT NULL,
           data       jsonb NOT NULL
         )`,
      )
      .then(() => undefined)
      .catch((err) => {
        // Дать повторить попытку при следующем запросе, если БД была недоступна.
        schemaReady = undefined;
        throw err;
      });
  }
  return schemaReady;
}
