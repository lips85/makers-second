// Export all schemas
export * from './orgs'
export * from './users'
export * from './word-items'
export * from './rounds'
export * from './round-items'
export * from './leaderboards'

// Import all schemas for relationships
import { orgs } from './orgs'
import { users } from './users'
import { wordItems } from './word-items'
import { rounds } from './rounds'
import { roundItems } from './round-items'
import { leaderboards } from './leaderboards'

// Export all tables for Drizzle Kit
export const schema = {
  orgs,
  users,
  wordItems,
  rounds,
  roundItems,
  leaderboards,
}
