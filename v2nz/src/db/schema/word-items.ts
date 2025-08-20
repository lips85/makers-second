import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'

export const wordItems = pgTable('word_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  word: varchar('word', { length: 80 }).notNull(),
  meaning: varchar('meaning', { length: 200 }).notNull(),
  difficulty: varchar('difficulty', { length: 10 }).notNull(), // easy, medium, hard
  category: varchar('category', { length: 50 }),
  tags: jsonb('tags'), // string array
  exampleSentence: text('example_sentence'),
  createdBy: uuid('created_by').references(() => users.id),
  isApproved: boolean('is_approved').default(false).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type WordItem = typeof wordItems.$inferSelect
export type NewWordItem = typeof wordItems.$inferInsert
