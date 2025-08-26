import { computeRoundMetrics } from './round-metrics'

describe('computeRoundMetrics', () => {
  const mockItems = [
    { isCorrect: true, responseTimeMs: 2000, score: 100 },
    { isCorrect: true, responseTimeMs: 1500, score: 100 },
    { isCorrect: false, responseTimeMs: 3000, score: 0 },
    { isCorrect: true, responseTimeMs: 1800, score: 100 },
  ]

  it('should calculate correct accuracy', () => {
    const result = computeRoundMetrics(mockItems, 60)
    expect(result.accuracy).toBe(75) // 3 correct out of 4
  })

  it('should calculate correct total score', () => {
    const result = computeRoundMetrics(mockItems, 60)
    expect(result.totalScore).toBe(300) // 100 * 3 correct answers
  })

  it('should calculate correct average response time', () => {
    const result = computeRoundMetrics(mockItems, 60)
    expect(result.averageResponseTime).toBe(2075) // (2000 + 1500 + 3000 + 1800) / 4
  })

  it('should calculate correct speed score', () => {
    const result = computeRoundMetrics(mockItems, 60)
    // Speed score should be based on average response time
    expect(result.speed).toBe(2075)
  })

  it('should calculate normalized speed correctly', () => {
    const result = computeRoundMetrics(mockItems, 60)
    // Normalized speed should be between 0 and 100
    expect(result.normalizedSpeed).toBeGreaterThanOrEqual(0)
    expect(result.normalizedSpeed).toBeLessThanOrEqual(100)
  })

  it('should handle empty items array', () => {
    const result = computeRoundMetrics([], 60)
    expect(result.accuracy).toBe(0)
    expect(result.totalScore).toBe(0)
    expect(result.averageResponseTime).toBe(0)
    expect(result.speed).toBe(0)
    expect(result.normalizedSpeed).toBe(0)
  })

  it('should handle all correct answers', () => {
    const allCorrect = [
      { isCorrect: true, responseTimeMs: 1000, score: 100 },
      { isCorrect: true, responseTimeMs: 1200, score: 100 },
    ]
    const result = computeRoundMetrics(allCorrect, 60)
    expect(result.accuracy).toBe(100)
    expect(result.totalScore).toBe(200)
  })

  it('should handle all incorrect answers', () => {
    const allIncorrect = [
      { isCorrect: false, responseTimeMs: 5000, score: 0 },
      { isCorrect: false, responseTimeMs: 6000, score: 0 },
    ]
    const result = computeRoundMetrics(allIncorrect, 60)
    expect(result.accuracy).toBe(0)
    expect(result.totalScore).toBe(0)
  })

  it('should calculate grade correctly', () => {
    const perfectItems = [
      { isCorrect: true, responseTimeMs: 1000, score: 100 },
      { isCorrect: true, responseTimeMs: 1000, score: 100 },
    ]
    const result = computeRoundMetrics(perfectItems, 60)
    expect(result.grade).toBe('S')
  })

  it('should handle different durations', () => {
    const result60 = computeRoundMetrics(mockItems, 60)
    const result75 = computeRoundMetrics(mockItems, 75)
    const result90 = computeRoundMetrics(mockItems, 90)

    // Different durations should affect normalized speed
    expect(result60.normalizedSpeed).not.toBe(result75.normalizedSpeed)
    expect(result75.normalizedSpeed).not.toBe(result90.normalizedSpeed)
  })

  it('should handle edge case with very fast responses', () => {
    const fastItems = [
      { isCorrect: true, responseTimeMs: 100, score: 100 },
      { isCorrect: true, responseTimeMs: 200, score: 100 },
    ]
    const result = computeRoundMetrics(fastItems, 60)
    expect(result.averageResponseTime).toBe(150)
    expect(result.normalizedSpeed).toBeGreaterThan(50) // Should be high for fast responses
  })

  it('should handle edge case with very slow responses', () => {
    const slowItems = [
      { isCorrect: true, responseTimeMs: 10000, score: 100 },
      { isCorrect: true, responseTimeMs: 15000, score: 100 },
    ]
    const result = computeRoundMetrics(slowItems, 60)
    expect(result.averageResponseTime).toBe(12500)
    expect(result.normalizedSpeed).toBeLessThan(50) // Should be low for slow responses
  })

  it('should calculate max possible score correctly', () => {
    const result = computeRoundMetrics(mockItems, 60)
    expect(result.maxPossibleScore).toBe(400) // 4 items * 100 points each
  })

  it('should handle single item', () => {
    const singleItem = [{ isCorrect: true, responseTimeMs: 2000, score: 100 }]
    const result = computeRoundMetrics(singleItem, 60)
    expect(result.accuracy).toBe(100)
    expect(result.totalScore).toBe(100)
    expect(result.averageResponseTime).toBe(2000)
  })

  it('should handle items with zero scores', () => {
    const zeroScoreItems = [
      { isCorrect: true, responseTimeMs: 2000, score: 0 },
      { isCorrect: false, responseTimeMs: 3000, score: 0 },
    ]
    const result = computeRoundMetrics(zeroScoreItems, 60)
    expect(result.totalScore).toBe(0)
    expect(result.accuracy).toBe(50) // 1 correct out of 2
  })
})
