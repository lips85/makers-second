import { db } from '../src/db/client'
import { orgs, users, wordItems, rounds, roundItems, leaderboards } from '../src/db/schema'
import { eq } from 'drizzle-orm'
import 'dotenv/config'
import { env } from '../src/lib/env'

// Check if seeding is enabled
if (env.NODE_ENV === 'production') {
  console.error('❌ Seeding is not allowed in production environment')
  process.exit(1)
}

if (!(env.NODE_ENV === 'development' || env.SEED_ENABLED)) {
  console.log('🌱 Seed skipped - not in development mode')
  process.exit(0)
}

// Additional safety check for production-like environments
if (env.NODE_ENV === 'test' && !env.SEED_ENABLED) {
  console.log('🌱 Seed skipped - test environment without explicit enable')
  process.exit(0)
}

const run = async () => {
  try {
    console.log('🌱 Starting database seeding...')
    
    await db.transaction(async (tx) => {
      // Insert sample organizations
      console.log('  - Inserting organizations...')
      const [org1] = await tx.insert(orgs).values({
        name: '서울고등학교',
        code: 'SEOUL001',
        type: 'school',
        description: '서울시 강남구 소재 고등학교'
      }).onConflictDoNothing().returning()
      
      const [org2] = await tx.insert(orgs).values({
        name: '영어학원 ABC',
        code: 'ABC001',
        type: 'academy',
        description: '전문 영어 교육 학원'
      }).onConflictDoNothing().returning()
      
      const [org3] = await tx.insert(orgs).values({
        name: '스터디그룹 베타',
        code: 'BETA001',
        type: 'study_group',
        description: '온라인 영어 스터디 그룹'
      }).onConflictDoNothing().returning()

      // Insert sample users
      console.log('  - Inserting users...')
      const [user1] = await tx.insert(users).values({
        authId: '11111111-1111-1111-1111-111111111111',
        email: 'alice@example.com',
        username: 'alice',
        displayName: 'Alice Kim',
        role: 'student',
        orgId: org1?.id,
        gradeLevel: 10
      }).onConflictDoNothing().returning()
      
      const [user2] = await tx.insert(users).values({
        authId: '22222222-2222-2222-2222-222222222222',
        email: 'bob@example.com',
        username: 'bob',
        displayName: 'Bob Lee',
        role: 'student',
        orgId: org1?.id,
        gradeLevel: 11
      }).onConflictDoNothing().returning()
      
      const [teacher1] = await tx.insert(users).values({
        authId: '33333333-3333-3333-3333-333333333333',
        email: 'teacher@example.com',
        username: 'teacher',
        displayName: 'Teacher Park',
        role: 'teacher',
        orgId: org1?.id
      }).onConflictDoNothing().returning()

      // Insert sample word items
      console.log('  - Inserting word items...')
      const wordData = [
        { word: 'apple', meaning: '사과', difficulty: 'easy', category: 'food', tags: ['fruit', 'basic'] },
        { word: 'beautiful', meaning: '아름다운', difficulty: 'medium', category: 'adjective', tags: ['appearance', 'positive'] },
        { word: 'computer', meaning: '컴퓨터', difficulty: 'easy', category: 'technology', tags: ['device', 'modern'] },
        { word: 'determine', meaning: '결정하다', difficulty: 'hard', category: 'verb', tags: ['action', 'decision'] },
        { word: 'education', meaning: '교육', difficulty: 'medium', category: 'noun', tags: ['learning', 'school'] },
        { word: 'freedom', meaning: '자유', difficulty: 'medium', category: 'noun', tags: ['concept', 'positive'] },
        { word: 'government', meaning: '정부', difficulty: 'hard', category: 'noun', tags: ['politics', 'institution'] },
        { word: 'happiness', meaning: '행복', difficulty: 'medium', category: 'noun', tags: ['emotion', 'positive'] },
        { word: 'important', meaning: '중요한', difficulty: 'medium', category: 'adjective', tags: ['value', 'priority'] },
        { word: 'journey', meaning: '여행', difficulty: 'medium', category: 'noun', tags: ['travel', 'experience'] }
      ]
      
      const insertedWords = await tx.insert(wordItems).values(wordData).onConflictDoNothing().returning()

      // Insert sample rounds
      console.log('  - Inserting rounds...')
      const [round1] = await tx.insert(rounds).values({
        userId: user1?.id!,
        orgId: org1?.id,
        durationSec: 60,
        status: 'completed',
        startTime: new Date('2024-01-15T10:00:00Z'),
        endTime: new Date('2024-01-15T10:01:00Z'),
        totalQuestions: 10,
        correctAnswers: 8,
        totalScore: 820,
        avgResponseTimeMs: 3500
      }).returning()
      
      const [round2] = await tx.insert(rounds).values({
        userId: user2?.id!,
        orgId: org1?.id,
        durationSec: 75,
        status: 'completed',
        startTime: new Date('2024-01-15T11:00:00Z'),
        endTime: new Date('2024-01-15T11:01:15Z'),
        totalQuestions: 12,
        correctAnswers: 10,
        totalScore: 950,
        avgResponseTimeMs: 3200
      }).returning()

      // Insert sample round items
      console.log('  - Inserting round items...')
      const roundItemData = [
        { roundId: round1?.id!, wordItemId: insertedWords[0]?.id!, questionOrder: 1, userAnswer: '사과', isCorrect: true, responseTimeMs: 3000, score: 100 },
        { roundId: round1?.id!, wordItemId: insertedWords[1]?.id!, questionOrder: 2, userAnswer: '아름다운', isCorrect: true, responseTimeMs: 4000, score: 120 },
        { roundId: round1?.id!, wordItemId: insertedWords[2]?.id!, questionOrder: 3, userAnswer: '컴퓨터', isCorrect: true, responseTimeMs: 2500, score: 110 },
        { roundId: round2?.id!, wordItemId: insertedWords[3]?.id!, questionOrder: 1, userAnswer: '결정하다', isCorrect: true, responseTimeMs: 3500, score: 130 },
        { roundId: round2?.id!, wordItemId: insertedWords[4]?.id!, questionOrder: 2, userAnswer: '교육', isCorrect: true, responseTimeMs: 2800, score: 115 }
      ]
      
      await tx.insert(roundItems).values(roundItemData).onConflictDoNothing()

      // Insert sample leaderboards
      console.log('  - Inserting leaderboards...')
      const leaderboardData = [
        { userId: user1?.id!, orgId: org1?.id, period: 'daily', scope: 'global', subject: 'vocabulary', totalScore: 820, totalRounds: 1, bestScore: 820, avgScore: 820, rankPosition: 1, percentile: 95 },
        { userId: user2?.id!, orgId: org1?.id, period: 'daily', scope: 'global', subject: 'vocabulary', totalScore: 950, totalRounds: 1, bestScore: 950, avgScore: 950, rankPosition: 2, percentile: 90 },
        { userId: user1?.id!, orgId: org1?.id, period: 'weekly', scope: 'school', subject: 'vocabulary', totalScore: 820, totalRounds: 1, bestScore: 820, avgScore: 820, rankPosition: 1, percentile: 100 }
      ]
      
      await tx.insert(leaderboards).values(leaderboardData).onConflictDoNothing()
    })
    
    console.log('✅ Database seeding completed successfully')
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

run().catch((error) => {
  console.error('Script failed:', error)
  process.exit(1)
})
