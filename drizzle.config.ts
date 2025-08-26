import { defineConfig } from 'drizzle-kit'
import { env } from './src/lib/env'

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: env.SUPABASE_DB_URL,
    ssl: true,
  },
  verbose: true,
  strict: true,
})
