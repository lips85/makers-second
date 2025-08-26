#!/usr/bin/env node
/**
 * Schema Comparison Script for CI/CD
 * 로컬 스키마와 Supabase 프로덕션 DB 스키마를 비교하여 동기화 상태를 확인합니다.
 */

import { createClient } from '@supabase/supabase-js'
import { db } from '../src/db/client'
import { sql } from 'drizzle-orm'
import { env } from '../src/lib/env'

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string
  column_default: string | null
}

interface SchemaComparisonResult {
  missingTables: string[]
  extraTables: string[]
  columnMismatches: Array<{
    table: string
    column: string
    local: string
    remote: string
  }>
  isValid: boolean
}

const EXPECTED_TABLES = [
  'users',
  'orgs', 
  'word_items',
  'rounds',
  'round_items',
  'leaderboards',
  'attendance_logs',
  'wrong_answers',
  'org_codes',
  'guest_sessions'
]

async function getLocalSchema(): Promise<TableInfo[]> {
  console.log('📊 로컬 스키마 정보 수집 중...')
  
  const result = await db.execute(sql`
    SELECT 
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `)
  
  return result as TableInfo[]
}

async function getSupabaseSchema(): Promise<TableInfo[]> {
  console.log('🌐 Supabase 스키마 정보 수집 중...')
  
  const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data, error } = await supabase.rpc('get_schema_info')
  
  if (error) {
    // Fallback: 직접 정보 스키마 조회 (권한 있는 경우)
    console.warn('RPC 호출 실패, 직접 조회 시도...', error.message)
    throw new Error(`Supabase 스키마 정보를 가져올 수 없습니다: ${error.message}`)
  }
  
  return data as TableInfo[]
}

async function compareSchemas(): Promise<SchemaComparisonResult> {
  try {
    const [localSchema, supabaseSchema] = await Promise.all([
      getLocalSchema(),
      getSupabaseSchema()
    ])
    
    // 테이블 목록 비교
    const localTables = [...new Set(localSchema.map(t => t.table_name))]
    const supabaseTables = [...new Set(supabaseSchema.map(t => t.table_name))]
    
    const missingTables = EXPECTED_TABLES.filter(table => !supabaseTables.includes(table))
    const extraTables = supabaseTables.filter(table => 
      !EXPECTED_TABLES.includes(table) && 
      !table.startsWith('auth') && 
      !table.startsWith('storage') &&
      !table.startsWith('realtime')
    )
    
    console.log('📋 테이블 비교 결과:')
    console.log(`  로컬: ${localTables.length}개 테이블`)
    console.log(`  Supabase: ${supabaseTables.length}개 테이블`)
    console.log(`  누락된 테이블: ${missingTables.length}개`)
    console.log(`  추가된 테이블: ${extraTables.length}개`)
    
    if (missingTables.length > 0) {
      console.error('❌ 누락된 테이블:', missingTables)
    }
    
    if (extraTables.length > 0) {
      console.warn('⚠️  추가된 테이블:', extraTables)
    }
    
    // 컬럼 비교 (공통 테이블에 대해서만)
    const columnMismatches: SchemaComparisonResult['columnMismatches'] = []
    const commonTables = localTables.filter(table => supabaseTables.includes(table))
    
    for (const tableName of commonTables) {
      const localColumns = localSchema.filter(t => t.table_name === tableName)
      const supabaseColumns = supabaseSchema.filter(t => t.table_name === tableName)
      
      for (const localCol of localColumns) {
        const supabaseCol = supabaseColumns.find(c => c.column_name === localCol.column_name)
        
        if (!supabaseCol) {
          columnMismatches.push({
            table: tableName,
            column: localCol.column_name,
            local: `exists (${localCol.data_type})`,
            remote: 'missing'
          })
        } else if (localCol.data_type !== supabaseCol.data_type) {
          columnMismatches.push({
            table: tableName,
            column: localCol.column_name,
            local: localCol.data_type,
            remote: supabaseCol.data_type
          })
        }
      }
    }
    
    if (columnMismatches.length > 0) {
      console.error('❌ 컬럼 불일치:', columnMismatches)
    }
    
    const isValid = missingTables.length === 0 && columnMismatches.length === 0
    
    return {
      missingTables,
      extraTables,
      columnMismatches,
      isValid
    }
    
  } catch (error) {
    console.error('스키마 비교 중 오류 발생:', error)
    throw error
  }
}

async function main() {
  console.log('🔍 스키마 동기화 상태 확인 시작...\n')
  
  try {
    const result = await compareSchemas()
    
    if (result.isValid) {
      console.log('✅ 스키마 동기화 상태: 정상')
      console.log('   로컬과 Supabase 스키마가 일치합니다.')
    } else {
      console.error('❌ 스키마 동기화 상태: 불일치')
      console.error('   마이그레이션이 필요합니다.')
      
      if (result.missingTables.length > 0) {
        console.error(`\n📋 누락된 테이블 (${result.missingTables.length}개):`)
        result.missingTables.forEach(table => console.error(`   - ${table}`))
      }
      
      if (result.columnMismatches.length > 0) {
        console.error(`\n📋 컬럼 불일치 (${result.columnMismatches.length}개):`)
        result.columnMismatches.forEach(mismatch => {
          console.error(`   - ${mismatch.table}.${mismatch.column}: ${mismatch.local} → ${mismatch.remote}`)
        })
      }
      
      process.exit(1)
    }
    
  } catch (error) {
    console.error('스키마 비교 실패:', error)
    process.exit(1)
  }
}

// CI 환경에서만 실행
if (require.main === module) {
  main()
}

export { compareSchemas, type SchemaComparisonResult }
