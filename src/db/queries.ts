import { db } from './index.ts';
import { users, notes } from './schema.ts';
import { eq, and, gt, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addHours, isAfter } from 'date-fns';

export async function getOrCreateUser(uid: string, email: string) {
  const result = await db.insert(users)
    .values({ id: uid, email })
    .onConflictDoUpdate({
      target: users.id,
      set: { email },
    })
    .returning();
  return result[0];
}

export async function dropNote(
  userId: string,
  latitude: number,
  longitude: number,
  content: string,
  writtenWeather?: string | null,
  writtenTime?: string | null,
) {
  return await db.transaction(async (tx) => {
    const updated = await tx.update(users)
      .set({ pagesLeft: sql`${users.pagesLeft} - 1` })
      .where(and(eq(users.id, userId), gt(users.pagesLeft, 0)))
      .returning();
    if (updated.length === 0) {
      throw new Error("No pages left to drop a note.");
    }

    const note = await tx.insert(notes).values({
      id: uuidv4(),
      userId,
      latitude,
      longitude,
      content,
      writtenWeather: writtenWeather ?? null,
      writtenTime: writtenTime ?? null,
    }).returning();
    
    return note[0];
  });
}

function distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRad = (value: number) => value * Math.PI / 180;
  const R = 6371e3;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lng2 - lng1);
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const SEED_NOTE_ID = 'seed-note-mission-district';
const SEED_USER_ID = 'seed-wanderer';

export async function moveSeedNoteTo(latitude: number, longitude: number) {
  await db.insert(users)
    .values({ id: SEED_USER_ID, email: 'wanderer@drift.local', pagesLeft: 3 })
    .onConflictDoNothing();

  const existing = await db.select().from(notes).where(eq(notes.id, SEED_NOTE_ID)).limit(1);
  if (existing.length === 0) {
    await db.insert(notes).values({
      id: SEED_NOTE_ID,
      userId: SEED_USER_ID,
      latitude,
      longitude,
      content: 'If you found this, you were looking. Stay a little longer.',
      isDormant: true,
      echoCount: 0,
      writtenWeather: 'Rain',
      writtenTime: 'Night',
    });
    return;
  }

  const seedPatch: { latitude: number; longitude: number; writtenWeather: string; writtenTime: string } = {
    latitude,
    longitude,
    writtenWeather: 'Rain',
    writtenTime: 'Night',
  };

  if (distanceMeters(latitude, longitude, existing[0].latitude, existing[0].longitude) > 15
    || existing[0].writtenWeather !== 'Rain'
    || existing[0].writtenTime !== 'Night') {
    await db.update(notes)
      .set(seedPatch)
      .where(eq(notes.id, SEED_NOTE_ID));
  }
}

export async function getNearbyNotes(latitude: number, longitude: number, currentUserId: string) {
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    await moveSeedNoteTo(latitude, longitude);
  }

  const allNotes = await db.select().from(notes);
  
  const now = new Date();

  const validNotes = allNotes.filter(note => {
    if (!note.isDormant && note.firstReadAt) {
      const decayTime = addDays(addHours(note.firstReadAt, 24), note.echoCount * 7);
      if (isAfter(now, decayTime)) {
        return false;
      }
    }

    return distanceMeters(latitude, longitude, note.latitude, note.longitude) <= 15;
  });
  
  return validNotes;
}

export async function readNote(noteId: string, userId: string) {
  const noteResult = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!noteResult || noteResult.length === 0) throw new Error("Note not found");
  
  const note = noteResult[0];
  // If user is author, don't trigger read
  if (note.userId === userId) return note;
  
  if (note.isDormant) {
    const updated = await db.update(notes)
      .set({ isDormant: false, firstReadAt: new Date() })
      .where(eq(notes.id, noteId))
      .returning();
    return updated[0];
  }
  return note;
}

export async function echoNote(noteId: string) {
  const noteResult = await db.select().from(notes).where(eq(notes.id, noteId)).limit(1);
  if (!noteResult || noteResult.length === 0) throw new Error("Note not found");
  
  const note = noteResult[0];
  const updated = await db.update(notes)
    .set({ echoCount: note.echoCount + 1 })
    .where(eq(notes.id, noteId))
    .returning();
  
  return updated[0];
}
