import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, real, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Firebase Auth UID
  email: text('email').notNull(),
  pagesLeft: integer('pages_left').notNull().default(3), // Scarcity logic
  createdAt: timestamp('created_at').defaultNow(),
});

export const notes = pgTable('notes', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  content: text('content').notNull(),
  isDormant: boolean('is_dormant').default(true).notNull(),
  firstReadAt: timestamp('first_read_at'),
  echoCount: integer('echo_count').default(0).notNull(),
  writtenWeather: text('written_weather'),
  writtenTime: text('written_time'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const notesRelations = relations(notes, ({ one }) => ({
  author: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
}));
