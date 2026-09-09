import { sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users, notes } from './schema.ts';
import { eq } from 'drizzle-orm';

const SEED_USER_ID = 'seed-wanderer';
const SEED_LAT = Number(process.env.VITE_DEV_DEFAULT_LAT || 37.7749);
const SEED_LNG = Number(process.env.VITE_DEV_DEFAULT_LNG || -122.4194);

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

  if (process.env.DEV_AUTH_BYPASS === 'true') {
    await seedDemoNote();
  }
}

async function seedDemoNote() {
  await db.insert(users)
    .values({ id: SEED_USER_ID, email: 'wanderer@drift.local', pagesLeft: 3 })
    .onConflictDoNothing();

  const existing = await db.select().from(notes).where(eq(notes.userId, SEED_USER_ID)).limit(1);
  if (existing.length > 0) return;

  await db.insert(notes).values({
    id: 'seed-note-mission-district',
    userId: SEED_USER_ID,
    latitude: SEED_LAT,
    longitude: SEED_LNG,
    content: 'If you found this, you were looking. Stay a little longer.',
    isDormant: true,
    echoCount: 0,
  });
}
