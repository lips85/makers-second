import { db } from './client'
import { sql } from 'drizzle-orm'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

const run = async () => {
  try {
    console.log('🔍 Starting database verification...')
    
    // 1. Schema verification
    console.log('  - Verifying schema...')
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'rounds', 'round_items', 'leaderboards', 'orgs', 'word_items')
      ORDER BY table_name
    `)
    
    const expectedTables = ['users', 'rounds', 'round_items', 'leaderboards', 'orgs', 'word_items']
    const foundTables = tables.map(row => row.table_name)
    
    if (foundTables.length !== expectedTables.length) {
      throw new Error(`Schema mismatch: expected ${expectedTables.length} tables, found ${foundTables.length}`)
    }
    
    for (const expectedTable of expectedTables) {
      if (!foundTables.includes(expectedTable)) {
        throw new Error(`Missing table: ${expectedTable}`)
      }
    }
    
    console.log('    ✅ Schema verification passed')
    
    // 2. RLS verification
    console.log('  - Verifying RLS policies...')
    const rlsEnabled = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'rounds', 'round_items', 'leaderboards', 'orgs', 'word_items')
      AND row_security = true
    `)
    
    if (rlsEnabled.length !== expectedTables.length) {
      throw new Error(`RLS not enabled on all tables: ${rlsEnabled.length}/${expectedTables.length}`)
    }
    
    console.log('    ✅ RLS verification passed')
    
    // 3. Sample data verification
    console.log('  - Verifying sample data...')
    const orgCount = await db.execute(sql`SELECT COUNT(*) as count FROM orgs`)
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`)
    const wordCount = await db.execute(sql`SELECT COUNT(*) as count FROM word_items`)
    const roundCount = await db.execute(sql`SELECT COUNT(*) as count FROM rounds`)
    const leaderboardCount = await db.execute(sql`SELECT COUNT(*) as count FROM leaderboards`)
    
    console.log(`    - Orgs: ${orgCount[0].count}`)
    console.log(`    - Users: ${userCount[0].count}`)
    console.log(`    - Words: ${wordCount[0].count}`)
    console.log(`    - Rounds: ${roundCount[0].count}`)
    console.log(`    - Leaderboards: ${leaderboardCount[0].count}`)
    
    if (orgCount[0].count === 0 || userCount[0].count === 0 || wordCount[0].count === 0) {
      throw new Error('Sample data not found - run db:seed first')
    }
    
    console.log('    ✅ Sample data verification passed')
    
    // 4. Sample queries verification
    console.log('  - Verifying sample queries...')
    
    // Test leaderboard query
    const leaderboardQuery = await db.execute(sql`
      SELECT l.*, u.display_name, o.name as org_name
      FROM leaderboards l
      LEFT JOIN users u ON l.user_id = u.id
      LEFT JOIN orgs o ON l.org_id = o.id
      WHERE l.period = 'daily' AND l.scope = 'global'
      ORDER BY l.total_score DESC
      LIMIT 5
    `)
    
    console.log(`    - Leaderboard query returned ${leaderboardQuery.length} rows`)
    
    // Test word items query
    const wordQuery = await db.execute(sql`
      SELECT word, meaning, difficulty, category
      FROM word_items
      WHERE difficulty = 'easy'
      ORDER BY usage_count DESC
      LIMIT 5
    `)
    
    console.log(`    - Word query returned ${wordQuery.length} rows`)
    
    console.log('    ✅ Sample queries verification passed')
    
    // 5. Supabase client verification (if in development)
    if (env.NODE_ENV === 'development') {
      console.log('  - Verifying Supabase client access...')
      
      const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      // Test public table access (should work)
      const { data: publicData, error: publicError } = await supabase
        .from('word_items')
        .select('word, meaning')
        .limit(1)
      
      if (publicError) {
        throw new Error(`Public table access failed: ${publicError.message}`)
      }
      
      console.log('    ✅ Public table access verified')
      
      // Test private table access (should fail)
      const { data: privateData, error: privateError } = await supabase
        .from('users')
        .select('id')
        .limit(1)
      
      if (!privateError) {
        throw new Error('Private table access should be denied')
      }
      
      console.log('    ✅ Private table access properly denied')
    }
    
    console.log('✅ All verifications passed successfully')
    
  } catch (error) {
    console.error('❌ Verification failed:', error)
    process.exit(1)
  }
}

run().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})
