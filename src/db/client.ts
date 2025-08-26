import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '@/lib/env'

// Create connection pool with SSL enforcement
const pool = new Pool({
  connectionString: env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
  min: env.DB_POOL_MIN,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: env.DB_POOL_IDLE_TIMEOUT,
})

// Create Drizzle instance
export const db = drizzle(pool)

// Test database connection
export async function testConnection() {
  try {
    const client = await pool.connect()
    await client.query('SELECT NOW()')
    client.release()
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    return false
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database pool...')
  await pool.end()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('Shutting down database pool...')
  await pool.end()
  process.exit(0)
})
