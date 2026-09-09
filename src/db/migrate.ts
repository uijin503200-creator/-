import { sql } from 'drizzle-orm';
import { db } from './index.ts';

export async function ensureSchema() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY,
      email text NOT NULL,
      pages_left integer NOT NULL DEFAULT 3,
      created_at timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS notes (
      id text PRIMARY KEY,
      user_id text NOT NULL REFERENCES users(id),
      latitude real NOT NULL,
      longitude real NOT NULL,
      content text NOT NULL,
      is_dormant boolean NOT NULL DEFAULT true,
      first_read_at timestamp,
      echo_count integer NOT NULL DEFAULT 0,
      created_at timestamp DEFAULT now()
    )
  `);

  await db.execute(sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS written_weather text`);
  await db.execute(sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS written_time text`);
}
