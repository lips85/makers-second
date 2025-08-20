import { pgTable, uuid, date, integer, timestamp, text } from 'drizzle-orm/pg-core'
import { users } from './users'

export const attendanceLogs = pgTable('attendance_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  attendDate: date('attend_date').notNull(),
  streakBefore: integer('streak_before').notNull().default(0),
  streakAfter: integer('streak_after').notNull().default(1),
  rewardPoints: integer('reward_points').notNull().default(10),
  totalPoints: integer('total_points').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export type AttendanceLog = typeof attendanceLogs.$inferSelect
export type NewAttendanceLog = typeof attendanceLogs.$inferInsert
