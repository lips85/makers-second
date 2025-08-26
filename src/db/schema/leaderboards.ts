import { pgTable, uuid, varchar, text, timestamp, boolean, integer, date } from 'drizzle-orm/pg-core'
import { users } from './users'
import { orgs } from './orgs'

export const leaderboards = pgTable('leaderboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  orgId: uuid('org_id').references(() => orgs.id),
  period: varchar('period', { length: 20 }).notNull(), // daily, weekly, monthly, all_time
  scope: varchar('scope', { length: 20 }).notNull(), // global, school, class, friends
  subject: varchar('subject', { length: 20 }).notNull(), // vocabulary, grammar, reading, mixed
  totalScore: integer('total_score').default(0).notNull(),
  totalRounds: integer('total_rounds').default(0).notNull(),
  bestScore: integer('best_score').default(0).notNull(),
  avgScore: integer('avg_score').default(0).notNull(),
  rankPosition: integer('rank_position').default(0).notNull(),
  percentile: integer('percentile').default(0).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Leaderboard = typeof leaderboards.$inferSelect
export type NewLeaderboard = typeof leaderboards.$inferInsert
