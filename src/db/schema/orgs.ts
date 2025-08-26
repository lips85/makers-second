import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const orgs = pgTable('orgs', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 120 }).notNull(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  type: varchar('type', { length: 20 }).notNull(), // school, academy, study_group, company
  description: text('description'),
  settings: jsonb('settings'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type Org = typeof orgs.$inferSelect
export type NewOrg = typeof orgs.$inferInsert
