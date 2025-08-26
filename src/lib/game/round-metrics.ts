/**
 * 라운드 결과 메트릭 계산 유틸리티
 * 정확도, 속도, 정규화된 속도, 총점을 계산합니다.
 */

export interface RoundMetrics {
  accuracy: number;        // 정확도 (0-100)
  speed: number;          // 평균 응답 속도 (ms)
  normalizedSpeed: number; // 정규화된 속도 (0-100)
  totalScore: number;     // 총점
  maxPossibleScore: number; // 최대 가능 점수
  grade: string;          // 등급 (S, A, B, C, D, F)
  percentile?: number;    // 퍼센타일 (0-100)
  stanine?: number;       // 스테나인 (1-9)
}

export interface RoundItem {
  isCorrect: boolean;
  responseTimeMs: number;
  score: number;
}

export interface RoundSubmission {
  durationSec: number;
  totalQuestions: number;
  correctAnswers: number;
  items: RoundItem[];
  startTime: Date;
  endTime: Date;
}

/**
 * 라운드 메트릭을 계산합니다.
 * @param submission 라운드 제출 데이터
 * @returns 계산된 메트릭
 */
export function computeRoundMetrics(submission: RoundSubmission): RoundMetrics {
  // 입력 검증
  if (!validateSubmission(submission)) {
    throw new Error('Invalid round submission data');
  }

  const { durationSec, totalQuestions, correctAnswers, items } = submission;

  // 정확도 계산 (0-100)
  const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;

  // 평균 응답 속도 계산 (ms)
  const validResponseTimes = items
    .filter(item => item.responseTimeMs > 0 && item.responseTimeMs <= 30000)
    .map(item => item.responseTimeMs);
  
  const speed = validResponseTimes.length > 0 
    ? validResponseTimes.reduce((sum, time) => sum + time, 0) / validResponseTimes.length 
    : 0;

  // 정규화된 속도 계산 (0-100)
  // 0ms = 100점, 30000ms = 0점 (선형 보간)
  const normalizedSpeed = speed > 0 
    ? Math.max(0, Math.min(100, ((30000 - speed) / 30000) * 100))
    : 100;

  // 총점 계산
  // 기본 점수: 정확도 * 1000
  // 속도 보너스: 정규화된 속도 * 10
  // 콤보 보너스: 연속 정답에 따른 추가 점수
  const baseScore = Math.round(accuracy * 10);
  const speedBonus = Math.round(normalizedSpeed);
  const comboBonus = calculateComboBonus(items);
  
  const totalScore = baseScore + speedBonus + comboBonus;
  const maxPossibleScore = 1000 + 100 + 500; // 기본 + 속도 + 최대 콤보

  // 등급 계산
  const grade = calculateGrade(totalScore, maxPossibleScore);

  return {
    accuracy: Math.round(accuracy * 100) / 100, // 소수점 2자리
    speed: Math.round(speed),
    normalizedSpeed: Math.round(normalizedSpeed * 100) / 100,
    totalScore,
    maxPossibleScore,
    grade,
  };
}

/**
 * 제출 데이터의 유효성을 검증합니다.
 */
function validateSubmission(submission: RoundSubmission): boolean {
  if (!submission || typeof submission !== 'object') return false;
  
  const { durationSec, totalQuestions, correctAnswers, items, startTime, endTime } = submission;
  
  // 기본 타입 검증
  if (typeof durationSec !== 'number' || durationSec <= 0) return false;
  if (typeof totalQuestions !== 'number' || totalQuestions <= 0) return false;
  if (typeof correctAnswers !== 'number' || correctAnswers < 0) return false;
  if (!Array.isArray(items)) return false;
  
  // 값 범위 검증
  if (correctAnswers > totalQuestions) return false;
  if (items.length !== totalQuestions) return false;
  
  // 시간 검증
  if (!(startTime instanceof Date) || !(endTime instanceof Date)) return false;
  if (endTime <= startTime) return false;
  
  // 아이템 검증
  for (const item of items) {
    if (typeof item.isCorrect !== 'boolean') return false;
    if (typeof item.responseTimeMs !== 'number' || item.responseTimeMs < 0) return false;
    if (typeof item.score !== 'number' || item.score < 0) return false;
  }
  
  return true;
}

/**
 * 콤보 보너스를 계산합니다.
 * 연속 정답에 따라 추가 점수를 부여합니다.
 */
function calculateComboBonus(items: RoundItem[]): number {
  let combo = 0;
  let totalBonus = 0;
  
  for (const item of items) {
    if (item.isCorrect) {
      combo++;
      // 콤보 보너스: 1콤보=10점, 2콤보=20점, 3콤보=30점...
      totalBonus += combo * 10;
    } else {
      combo = 0;
    }
  }
  
  return totalBonus;
}

/**
 * 점수에 따른 등급을 계산합니다.
 */
function calculateGrade(score: number, maxScore: number): string {
  const percentage = (score / maxScore) * 100;
  
  if (percentage >= 95) return 'S';
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

/**
 * 퍼센타일을 계산합니다.
 * @param score 현재 점수
 * @param allScores 모든 점수 배열
 * @returns 퍼센타일 (0-100)
 */
export function calculatePercentile(score: number, allScores: number[]): number {
  if (allScores.length === 0) return 0;
  
  const sortedScores = [...allScores].sort((a, b) => a - b);
  
  // score보다 작은 값의 개수를 계산
  const belowCount = sortedScores.filter(s => s < score).length;
  
  // 퍼센타일 계산: (작은 값의 개수 / 전체 개수) * 100
  return Math.round((belowCount / sortedScores.length) * 100);
}

/**
 * 스테나인을 계산합니다.
 * @param percentile 퍼센타일 (0-100)
 * @returns 스테나인 (1-9)
 */
export function calculateStanine(percentile: number): number {
  if (percentile >= 96) return 9;
  if (percentile >= 89) return 8;
  if (percentile >= 77) return 7;
  if (percentile >= 60) return 6;
  if (percentile >= 40) return 5;
  if (percentile >= 23) return 4;
  if (percentile >= 11) return 3;
  if (percentile >= 4) return 2;
  return 1;
}
