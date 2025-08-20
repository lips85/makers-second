import { pgTable, uuid, varchar, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'
import { users } from './users'
import { orgs } from './orgs'

export const rounds = pgTable('rounds', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  orgId: uuid('org_id').references(() => orgs.id),
  durationSec: integer('duration_sec').notNull(), // 60, 75, 90
  status: varchar('status', { length: 20 }).notNull().default('active'), // active, completed, abandoned
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  totalQuestions: integer('total_questions').default(0).notNull(),
  correctAnswers: integer('correct_answers').default(0).notNull(),
  totalScore: integer('total_score').default(0).notNull(),
  avgResponseTimeMs: integer('avg_response_time_ms').default(0).notNull(),
  settings: jsonb('settings'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Round = typeof rounds.$inferSelect
export type NewRound = typeof rounds.$inferInsert
