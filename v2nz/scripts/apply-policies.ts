import fs from 'node:fs'
import path from 'node:path'
import { Pool } from 'pg'
import 'dotenv/config'
import { env } from '../src/lib/env'

const pool = new Pool({
  connectionString: env.SUPABASE_DB_URL,
  ssl: {
    rejectUnauthorized: false,
  },
})

const dir = path.resolve('src/db/policies')
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort()

const run = async () => {
  const client = await pool.connect()
  
  try {
    console.log('🔐 Applying RLS policies...')
    
    // Check if policies already exist to avoid conflicts
    const existingPolicies = await client.query(`
      SELECT policyname, tablename 
      FROM pg_policies 
      WHERE schemaname = 'public'
    `)
    
    for (const file of files) {
      console.log(`  - Processing ${file}`)
      const sql = fs.readFileSync(path.join(dir, file), 'utf8')
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(stmt => stmt.trim())
      
      for (const statement of statements) {
        const trimmedStmt = statement.trim()
        if (!trimmedStmt) continue
        
        try {
          // For CREATE POLICY statements, check if policy already exists
          if (trimmedStmt.toUpperCase().includes('CREATE POLICY')) {
            const policyMatch = trimmedStmt.match(/CREATE POLICY "([^"]+)"/i)
            if (policyMatch) {
              const policyName = policyMatch[1]
              const tableMatch = trimmedStmt.match(/ON ([a-zA-Z_]+)/i)
              const tableName = tableMatch ? tableMatch[1] : ''
              
              const exists = existingPolicies.rows.some(
                row => row.policyname === policyName && row.tablename === tableName
              )
              
              if (exists) {
                console.log(`    - Policy ${policyName} already exists, skipping`)
                continue
              }
            }
          }
          
          await client.query(trimmedStmt)
          console.log(`    - Executed: ${trimmedStmt.substring(0, 50)}...`)
        } catch (error: any) {
          // Ignore "already exists" errors for idempotent operations
          if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
            console.log(`    - Skipped (already exists): ${trimmedStmt.substring(0, 50)}...`)
          } else {
            throw error
          }
        }
      }
    }
    
    console.log('✅ RLS policies applied successfully')
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})
