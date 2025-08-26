/**
 * 서버 사이드 라운드 제출 검증 모듈
 * 클라이언트에서 제출된 데이터의 유효성을 검증하고 서버에서 재계산합니다.
 */

import { computeRoundMetrics, type RoundSubmission, type RoundMetrics } from './round-metrics';

export enum ValidationErrorCode {
  INVALID_DURATION = 'INVALID_DURATION',
  INVALID_QUESTION_COUNT = 'INVALID_QUESTION_COUNT',
  INVALID_RESPONSE_TIME = 'INVALID_RESPONSE_TIME',
  INVALID_SCORE_DISCREPANCY = 'INVALID_SCORE_DISCREPANCY',
  INVALID_TIME_RANGE = 'INVALID_TIME_RANGE',
  INVALID_ACCURACY = 'INVALID_ACCURACY',
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  CLIENT_SERVER_MISMATCH = 'CLIENT_SERVER_MISMATCH'
}

export interface ValidationError {
  code: ValidationErrorCode;
  message: string;
  details?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  serverMetrics?: RoundMetrics;
  clientMetrics?: RoundMetrics;
}

export interface RoundSubmissionRequest {
  durationSec: number;
  totalQuestions: number;
  correctAnswers: number;
  items: Array<{
    isCorrect: boolean;
    responseTimeMs: number;
    score: number;
  }>;
  startTime: string; // ISO string
  endTime: string; // ISO string
  clientCalculatedScore?: number;
}

/**
 * 라운드 제출 데이터를 검증합니다.
 * @param request 클라이언트에서 제출된 데이터
 * @returns 검증 결과
 */
export function validateRoundSubmission(request: RoundSubmissionRequest): ValidationResult {
  const errors: ValidationError[] = [];

  // 1. 기본 데이터 검증
  const basicValidation = validateBasicData(request);
  errors.push(...basicValidation);

  // 2. 허용 범위 규칙 검증
  const rangeValidation = validateRangeRules(request);
  errors.push(...rangeValidation);

  // 3. 패턴 검증
  const patternValidation = validateSuspiciousPatterns(request);
  errors.push(...patternValidation);

  // 4. 서버 재계산 및 클라이언트 비교 (기본 검증이 통과한 경우에만)
  let serverMetrics: RoundMetrics | undefined;
  let clientMetrics: RoundMetrics | undefined;
  
  if (errors.length === 0) {
    const calculationValidation = validateClientServerCalculation(request);
    errors.push(...calculationValidation.errors);
    serverMetrics = calculationValidation.serverMetrics;
    clientMetrics = calculationValidation.clientMetrics;
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    serverMetrics,
    clientMetrics
  };
}

/**
 * 기본 데이터 유효성 검증
 */
function validateBasicData(request: RoundSubmissionRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // durationSec 검증
  if (![60, 75, 90].includes(request.durationSec)) {
    errors.push({
      code: ValidationErrorCode.INVALID_DURATION,
      message: 'Invalid duration. Must be 60, 75, or 90 seconds.',
      details: { durationSec: request.durationSec }
    });
  }

  // totalQuestions 검증
  if (request.totalQuestions < 1 || request.totalQuestions > 50) {
    errors.push({
      code: ValidationErrorCode.INVALID_QUESTION_COUNT,
      message: 'Invalid question count. Must be between 1 and 50.',
      details: { totalQuestions: request.totalQuestions }
    });
  }

  // correctAnswers 검증
  if (request.correctAnswers < 0 || request.correctAnswers > request.totalQuestions) {
    errors.push({
      code: ValidationErrorCode.INVALID_ACCURACY,
      message: 'Invalid correct answers count.',
      details: { correctAnswers: request.correctAnswers, totalQuestions: request.totalQuestions }
    });
  }

  // items 배열 검증
  if (request.items.length !== request.totalQuestions) {
    errors.push({
      code: ValidationErrorCode.INVALID_QUESTION_COUNT,
      message: 'Items count does not match total questions.',
      details: { itemsCount: request.items.length, totalQuestions: request.totalQuestions }
    });
  }

  return errors;
}

/**
 * 허용 범위 규칙 검증
 */
function validateRangeRules(request: RoundSubmissionRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // 응답 시간 검증
  for (let i = 0; i < request.items.length; i++) {
    const item = request.items[i];
    
    if (item.responseTimeMs < 0 || item.responseTimeMs > 30000) {
      errors.push({
        code: ValidationErrorCode.INVALID_RESPONSE_TIME,
        message: `Invalid response time at item ${i + 1}.`,
        details: { 
          itemIndex: i, 
          responseTimeMs: item.responseTimeMs,
          expectedRange: [0, 30000]
        }
      });
    }
  }

  // 시간 범위 검증
  try {
    const startTime = new Date(request.startTime);
    const endTime = new Date(request.endTime);
    
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      errors.push({
        code: ValidationErrorCode.INVALID_TIME_RANGE,
        message: 'Invalid time format.',
        details: { startTime: request.startTime, endTime: request.endTime }
      });
    } else {
      const actualDuration = (endTime.getTime() - startTime.getTime()) / 1000;
      const expectedDuration = request.durationSec;
      
      // 허용 오차: ±5초
      if (Math.abs(actualDuration - expectedDuration) > 5) {
        errors.push({
          code: ValidationErrorCode.INVALID_TIME_RANGE,
          message: 'Actual duration does not match expected duration.',
          details: { 
            actualDuration, 
            expectedDuration,
            tolerance: 5
          }
        });
      }
    }
  } catch (error) {
    errors.push({
      code: ValidationErrorCode.INVALID_TIME_RANGE,
      message: 'Failed to parse time values.',
      details: { startTime: request.startTime, endTime: request.endTime }
    });
  }

  return errors;
}

/**
 * 의심스러운 패턴 검증
 */
function validateSuspiciousPatterns(request: RoundSubmissionRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // 모든 응답 시간이 동일한 경우 (봇 의심)
  const responseTimes = request.items.map(item => item.responseTimeMs);
  const uniqueTimes = new Set(responseTimes);
  
  if (uniqueTimes.size === 1 && responseTimes.length > 3) {
    errors.push({
      code: ValidationErrorCode.SUSPICIOUS_PATTERN,
      message: 'All response times are identical. Possible bot activity.',
      details: { responseTime: responseTimes[0], count: responseTimes.length }
    });
  }

  // 너무 빠른 응답 시간 (0.5초 미만)
  const tooFastResponses = responseTimes.filter(time => time < 500);
  if (tooFastResponses.length > responseTimes.length * 0.3) {
    errors.push({
      code: ValidationErrorCode.SUSPICIOUS_PATTERN,
      message: 'Too many responses are suspiciously fast.',
      details: { 
        fastResponses: tooFastResponses.length,
        totalResponses: responseTimes.length,
        threshold: 0.3
      }
    });
  }

  // 정확도가 너무 높은 경우 (100% 정답)
  const accuracy = (request.correctAnswers / request.totalQuestions) * 100;
  if (accuracy === 100 && request.totalQuestions > 5) {
    errors.push({
      code: ValidationErrorCode.SUSPICIOUS_PATTERN,
      message: 'Perfect accuracy with many questions. Requires manual review.',
      details: { accuracy, totalQuestions: request.totalQuestions }
    });
  }

  return errors;
}

/**
 * 클라이언트-서버 계산 비교 검증
 */
function validateClientServerCalculation(request: RoundSubmissionRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  try {
    // 서버에서 재계산
    const serverSubmission: RoundSubmission = {
      durationSec: request.durationSec,
      totalQuestions: request.totalQuestions,
      correctAnswers: request.correctAnswers,
      items: request.items,
      startTime: new Date(request.startTime),
      endTime: new Date(request.endTime)
    };

    const serverMetrics = computeRoundMetrics(serverSubmission);

    // 클라이언트 점수와 서버 점수 비교
    if (request.clientCalculatedScore !== undefined) {
      const scoreDifference = Math.abs(request.clientCalculatedScore - serverMetrics.totalScore);
      
      if (scoreDifference > 10) { // 허용 오차: ±10점
        errors.push({
          code: ValidationErrorCode.CLIENT_SERVER_MISMATCH,
          message: 'Client and server score calculation mismatch.',
          details: {
            clientScore: request.clientCalculatedScore,
            serverScore: serverMetrics.totalScore,
            difference: scoreDifference,
            tolerance: 10
          }
        });
      }
    }

    // 검증 결과에 서버 메트릭 포함
    return {
      errors,
      serverMetrics,
      clientMetrics: request.clientCalculatedScore ? {
        ...serverMetrics,
        totalScore: request.clientCalculatedScore
      } : undefined
    };

  } catch (error) {
    errors.push({
      code: ValidationErrorCode.CLIENT_SERVER_MISMATCH,
      message: 'Failed to calculate server metrics.',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    });

    return { errors };
  }
}

/**
 * 검증 에러를 사용자 친화적인 메시지로 변환
 */
export function getValidationErrorMessage(errors: ValidationError[]): string {
  if (errors.length === 0) return 'Validation passed';

  const messages = errors.map(error => {
    switch (error.code) {
      case ValidationErrorCode.INVALID_DURATION:
        return '라운드 시간이 올바르지 않습니다.';
      case ValidationErrorCode.INVALID_QUESTION_COUNT:
        return '문제 개수가 올바르지 않습니다.';
      case ValidationErrorCode.INVALID_RESPONSE_TIME:
        return '응답 시간이 올바르지 않습니다.';
      case ValidationErrorCode.INVALID_SCORE_DISCREPANCY:
        return '점수 계산에 오류가 있습니다.';
      case ValidationErrorCode.INVALID_TIME_RANGE:
        return '시간 범위가 올바르지 않습니다.';
      case ValidationErrorCode.INVALID_ACCURACY:
        return '정확도 계산에 오류가 있습니다.';
      case ValidationErrorCode.SUSPICIOUS_PATTERN:
        return '의심스러운 패턴이 감지되었습니다.';
      case ValidationErrorCode.CLIENT_SERVER_MISMATCH:
        return '클라이언트와 서버 계산 결과가 일치하지 않습니다.';
      default:
        return '알 수 없는 검증 오류가 발생했습니다.';
    }
  });

  return messages.join(' ');
}
