export interface GameStats {
  totalQuestions: number
  correctAnswers: number
  totalScore: number
  accuracy: number
  currentCombo: number
  maxCombo: number
  averageResponseTime: number
  totalResponseTime: number
}

export interface AnswerResult {
  isCorrect: boolean
  score: number
  combo: number
  responseTime: number
  accuracy: number
}

export interface ScoringConfig {
  baseScore: number
  comboMultiplier: number
  timeBonusMultiplier: number
  maxTimeBonus: number
}

// Default scoring configuration
export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  baseScore: 100,
  comboMultiplier: 0.1, // 10% bonus per combo
  timeBonusMultiplier: 2, // 2x bonus for fast answers
  maxTimeBonus: 50 // Maximum 50% time bonus
}

/**
 * Preprocess answer text for consistent comparison
 */
export function preprocessAnswer(answer: string): string {
  return answer
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s가-힣]/g, '') // Remove special characters except letters, numbers, spaces, and Korean
}

/**
 * Judge if the user's answer is correct
 */
export function judgeAnswer(userAnswer: string, correctAnswer: string): boolean {
  const processedUserAnswer = preprocessAnswer(userAnswer)
  const processedCorrectAnswer = preprocessAnswer(correctAnswer)
  
  // Exact match
  if (processedUserAnswer === processedCorrectAnswer) {
    return true
  }
  
  // Check for common variations (but not empty strings)
  const variations = [
    processedCorrectAnswer,
    processedCorrectAnswer.replace(/\s+/g, ''), // No spaces
  ]
  
  // Only add non-empty variations
  if (processedCorrectAnswer.replace(/[가-힣]/g, '').length > 0) {
    variations.push(processedCorrectAnswer.replace(/[가-힣]/g, '')) // Korean only
  }
  if (processedCorrectAnswer.replace(/[a-zA-Z]/g, '').length > 0) {
    variations.push(processedCorrectAnswer.replace(/[a-zA-Z]/g, '')) // English only
  }
  
  return variations.includes(processedUserAnswer)
}

/**
 * Calculate score for a single answer
 */
export function calculateAnswerScore(
  isCorrect: boolean,
  responseTime: number,
  currentCombo: number,
  remainingTime: number,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): number {
  if (!isCorrect) {
    return 0
  }

  let score = config.baseScore

  // Combo bonus
  const comboBonus = Math.floor(score * config.comboMultiplier * currentCombo)
  score += comboBonus

  // Time bonus (faster answers get more points)
  const timeBonus = Math.min(
    Math.floor(score * config.timeBonusMultiplier * (1 - responseTime / 10000)), // 10 seconds = no bonus
    Math.floor(score * config.maxTimeBonus / 100)
  )
  score += timeBonus

  // Remaining time bonus (more time left = more points)
  const timeRemainingBonus = Math.floor(score * 0.1 * (remainingTime / 60)) // 10% bonus per minute remaining
  score += timeRemainingBonus

  return Math.max(score, 1) // Minimum 1 point
}

/**
 * Update game stats with a new answer
 */
export function updateGameStats(
  currentStats: GameStats,
  isCorrect: boolean,
  responseTime: number,
  score: number
): GameStats {
  const newTotalQuestions = currentStats.totalQuestions + 1
  const newCorrectAnswers = currentStats.correctAnswers + (isCorrect ? 1 : 0)
  const newTotalScore = currentStats.totalScore + score
  const newAccuracy = newTotalQuestions > 0 ? (newCorrectAnswers / newTotalQuestions) * 100 : 0
  
  const newCombo = isCorrect ? currentStats.currentCombo + 1 : 0
  const newMaxCombo = Math.max(currentStats.maxCombo, newCombo)
  
  const newTotalResponseTime = currentStats.totalResponseTime + responseTime
  const newAverageResponseTime = newCorrectAnswers > 0 ? newTotalResponseTime / newCorrectAnswers : 0

  return {
    totalQuestions: newTotalQuestions,
    correctAnswers: newCorrectAnswers,
    totalScore: newTotalScore,
    accuracy: newAccuracy,
    currentCombo: newCombo,
    maxCombo: newMaxCombo,
    averageResponseTime: newAverageResponseTime,
    totalResponseTime: newTotalResponseTime
  }
}

/**
 * Process a complete answer and return result
 */
export function processAnswer(
  userAnswer: string,
  correctAnswer: string,
  responseTime: number,
  currentCombo: number,
  remainingTime: number,
  currentStats: GameStats,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): { result: AnswerResult; newStats: GameStats } {
  const isCorrect = judgeAnswer(userAnswer, correctAnswer)
  const score = calculateAnswerScore(isCorrect, responseTime, currentCombo, remainingTime, config)
  const newCombo = isCorrect ? currentCombo + 1 : 0
  const newStats = updateGameStats(currentStats, isCorrect, responseTime, score)

  const result: AnswerResult = {
    isCorrect,
    score,
    combo: newCombo,
    responseTime,
    accuracy: newStats.accuracy
  }

  return { result, newStats }
}

/**
 * Calculate final game grade based on accuracy
 */
export function calculateGrade(accuracy: number): string {
  if (accuracy >= 95) return 'S'
  if (accuracy >= 90) return 'A'
  if (accuracy >= 80) return 'B'
  if (accuracy >= 70) return 'C'
  if (accuracy >= 60) return 'D'
  return 'F'
}

/**
 * Calculate performance rating (0-100)
 */
export function calculatePerformanceRating(stats: GameStats, totalTime: number): number {
  const accuracyWeight = 0.4
  const speedWeight = 0.3
  const comboWeight = 0.3

  const accuracyScore = stats.accuracy
  const speedScore = Math.min(100, (totalTime / stats.averageResponseTime) * 100)
  const comboScore = Math.min(100, (stats.maxCombo / 10) * 100) // 10+ combo = 100%

  return (
    accuracyScore * accuracyWeight +
    speedScore * speedWeight +
    comboScore * comboWeight
  )
}
