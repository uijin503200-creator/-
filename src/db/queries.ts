import { db } from './index.ts';
import { users, notes } from './schema.ts';
import { eq, sql, and } from 'drizzle-orm';
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

export async function dropNote(userId: string, latitude: number, longitude: number, content: string) {
  return await db.transaction(async (tx) => {
    const user = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.length === 0 || user[0].pagesLeft <= 0) {
      throw new Error("No pages left to drop a note.");
    }
    
    // Decrement pages
    await tx.update(users).set({ pagesLeft: user[0].pagesLeft - 1 }).where(eq(users.id, userId));
    
    // Create note
    const note = await tx.insert(notes).values({
      id: uuidv4(),
      userId,
      latitude,
      longitude,
      content,
    }).returning();
    
    return note[0];
  });
}

export async function getNearbyNotes(latitude: number, longitude: number, currentUserId: string) {
  // We use Haversine formula in SQL.
  // Earth radius in meters is approx 6371000
  // 15 meters radius
  const allNotes = await db.select().from(notes);
  
  const now = new Date();
  
  // Filter and calculate distance in TS for simplicity, or SQL. Let's do TS since the dataset is small for this prototype.
  const toRad = (value: number) => value * Math.PI / 180;
  
  const validNotes = allNotes.filter(note => {
    // Check decay
    if (!note.isDormant && note.firstReadAt) {
      const decayTime = addDays(addHours(note.firstReadAt, 24), note.echoCount * 7);
      if (isAfter(now, decayTime)) {
        return false; // Decayed
      }
    }
    
    // Check distance (Haversine)
    const R = 6371e3; // metres
    const φ1 = toRad(latitude);
    const φ2 = toRad(note.latitude);
    const Δφ = toRad(note.latitude - latitude);
    const Δλ = toRad(note.longitude - longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= 15;
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
