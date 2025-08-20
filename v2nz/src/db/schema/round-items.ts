import { pgTable, uuid, varchar, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core'
import { rounds } from './rounds'
import { wordItems } from './word-items'

export const roundItems = pgTable('round_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  roundId: uuid('round_id').references(() => rounds.id).notNull(),
  wordItemId: uuid('word_item_id').references(() => wordItems.id).notNull(),
  questionOrder: integer('question_order').notNull(),
  userAnswer: text('user_answer'),
  isCorrect: boolean('is_correct').notNull(),
  responseTimeMs: integer('response_time_ms').notNull(), // 0-30000ms
  score: integer('score').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type RoundItem = typeof roundItems.$inferSelect
export type NewRoundItem = typeof roundItems.$inferInsert
