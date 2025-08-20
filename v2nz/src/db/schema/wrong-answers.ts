import { pgTable, uuid, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'
import { wordItems } from './word-items'

export const wrongAnswers = pgTable('wrong_answers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  wordItemId: uuid('word_item_id').notNull().references(() => wordItems.id, { onDelete: 'cascade' }),
  wrongCount: integer('wrong_count').notNull().default(1),
  lastWrongAt: timestamp('last_wrong_at').notNull().defaultNow(),
  masteredAt: timestamp('mastered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type WrongAnswer = typeof wrongAnswers.$inferSelect
export type NewWrongAnswer = typeof wrongAnswers.$inferInsert
