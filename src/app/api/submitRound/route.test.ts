/**
 * 라운드 제출 API 통합 테스트
 */

import { POST } from './route'
import { NextRequest } from 'next/server'

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null
      })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'test-round-id' },
        error: null
      }),
      then: jest.fn().mockResolvedValue({
        data: null,
        error: null
      })
    }))
  }))
}))

// Mock percentile calculator
jest.mock('@/lib/game/percentile-utils', () => ({
  PercentileCalculator: jest.fn().mockImplementation(() => ({
    calculatePercentileStats: jest.fn().mockResolvedValue({
      percentile: 85.5,
      stanine: 7,
      totalPlayers: 1000
    })
  }))
}))

// Mock leaderboard utils
jest.mock('@/lib/game/leaderboard-utils', () => ({
  upsertLeaderboard: jest.fn().mockResolvedValue({
    success: true,
    updated: true
  }),
  getUserLeaderboardRank: jest.fn().mockResolvedValue({
    success: true,
    rank: 15,
    totalPlayers: 1000
  })
}))

describe('POST /api/submitRound', () => {
  const createMockRequest = (body: any): NextRequest => {
    return {
      json: jest.fn().mockResolvedValue(body),
      headers: new Map(),
      method: 'POST',
      url: 'http://localhost:3000/api/submitRound'
    } as any
  }

  const validRoundData = {
    durationSec: 60,
    totalQuestions: 10,
    correctAnswers: 8,
    items: [
      { isCorrect: true, responseTimeMs: 2000, score: 100 },
      { isCorrect: true, responseTimeMs: 1500, score: 100 },
      { isCorrect: false, responseTimeMs: 3000, score: 0 },
      { isCorrect: true, responseTimeMs: 1800, score: 100 },
      { isCorrect: true, responseTimeMs: 2200, score: 100 },
      { isCorrect: true, responseTimeMs: 1900, score: 100 },
      { isCorrect: true, responseTimeMs: 2100, score: 100 },
      { isCorrect: true, responseTimeMs: 1700, score: 100 },
      { isCorrect: false, responseTimeMs: 4000, score: 0 },
      { isCorrect: true, responseTimeMs: 1600, score: 100 }
    ],
    startTime: new Date('2024-01-01T10:00:00Z').toISOString(),
    endTime: new Date('2024-01-01T10:01:00Z').toISOString(),
    clientCalculatedScore: 800,
    roundId: 'test-round-id',
    wordItems: [
      { id: 'word-1', word: 'apple', meaning: '사과' },
      { id: 'word-2', word: 'banana', meaning: '바나나' }
    ]
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully submit a valid round', async () => {
    const request = createMockRequest(validRoundData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.roundId).toBe('test-round-id')
    expect(data.metrics).toBeDefined()
    expect(data.metrics.accuracy).toBe(80)
    expect(data.metrics.totalScore).toBe(800)
    expect(data.percentileStats).toBeDefined()
    expect(data.leaderboard).toBeDefined()
  })

  it('should return 400 for invalid request data', async () => {
    const invalidData = {
      durationSec: 60,
      totalQuestions: 10,
      correctAnswers: 15, // More than total questions
      items: [],
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString()
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Round validation failed')
  })

  it('should return 400 for invalid duration', async () => {
    const invalidData = {
      ...validRoundData,
      durationSec: 45 // Invalid duration
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for invalid total questions', async () => {
    const invalidData = {
      ...validRoundData,
      totalQuestions: 0 // Invalid total questions
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for invalid response times', async () => {
    const invalidData = {
      ...validRoundData,
      items: [
        { isCorrect: true, responseTimeMs: -1000, score: 100 }, // Negative response time
        { isCorrect: true, responseTimeMs: 50000, score: 100 }  // Too high response time
      ]
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for invalid time range', async () => {
    const invalidData = {
      ...validRoundData,
      startTime: new Date('2024-01-01T10:01:00Z').toISOString(),
      endTime: new Date('2024-01-01T10:00:00Z').toISOString() // End before start
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for duration mismatch', async () => {
    const invalidData = {
      ...validRoundData,
      durationSec: 60,
      startTime: new Date('2024-01-01T10:00:00Z').toISOString(),
      endTime: new Date('2024-01-01T10:02:00Z').toISOString() // 2 minutes, not 1 minute
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should return 400 for score mismatch', async () => {
    const invalidData = {
      ...validRoundData,
      clientCalculatedScore: 1000, // Different from actual calculated score
      items: [
        { isCorrect: true, responseTimeMs: 2000, score: 100 },
        { isCorrect: true, responseTimeMs: 1500, score: 100 }
      ]
    }

    const request = createMockRequest(invalidData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should handle missing authentication', async () => {
    // Mock unauthenticated user
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' }
        })
      }
    })

    const request = createMockRequest(validRoundData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(401)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Authentication required')
  })

  it('should handle database errors gracefully', async () => {
    // Mock database error
    const { createClient } = require('@supabase/supabase-js')
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null
        })
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }))
    })

    const request = createMockRequest(validRoundData)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.message).toBe('Failed to save round data')
  })

  it('should handle idempotency correctly', async () => {
    // First submission
    const request1 = createMockRequest(validRoundData)
    const response1 = await POST(request1)
    const data1 = await response1.json()

    expect(response1.status).toBe(200)
    expect(data1.success).toBe(true)

    // Second submission with same roundId should return success
    const request2 = createMockRequest(validRoundData)
    const response2 = await POST(request2)
    const data2 = await response2.json()

    expect(response2.status).toBe(200)
    expect(data2.success).toBe(true)
    expect(data2.message).toBe('Round already submitted')
  })

  it('should validate required fields', async () => {
    const missingFields = {
      durationSec: 60,
      // Missing totalQuestions, correctAnswers, items, etc.
    }

    const request = createMockRequest(missingFields)
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
  })

  it('should handle different durations correctly', async () => {
    const durations = [60, 75, 90]
    
    for (const duration of durations) {
      const data = { ...validRoundData, durationSec: duration }
      const request = createMockRequest(data)
      const response = await POST(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.metrics).toBeDefined()
    }
  })

  it('should calculate metrics correctly', async () => {
    const request = createMockRequest(validRoundData)
    const response = await POST(request)
    const data = await response.json()

    expect(data.metrics.accuracy).toBe(80) // 8 correct out of 10
    expect(data.metrics.totalScore).toBe(800) // 8 * 100
    expect(data.metrics.maxPossibleScore).toBe(1000) // 10 * 100
    expect(['S', 'A', 'B', 'C', 'D', 'F']).toContain(data.metrics.grade)
  })
})
