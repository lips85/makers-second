import { 
  validateRoundSubmission, 
  ValidationErrorCode,
  getValidationErrorMessage,
  type RoundSubmissionRequest 
} from './round-validation';

describe('validateRoundSubmission', () => {
  const createMockRequest = (overrides: Partial<RoundSubmissionRequest> = {}): RoundSubmissionRequest => ({
    durationSec: 60,
    totalQuestions: 10,
    correctAnswers: 8,
    items: Array.from({ length: 10 }, (_, i) => ({
      isCorrect: i < 8,
      responseTimeMs: 3000 + (i * 500),
      score: i < 8 ? 100 : 0
    })),
    startTime: '2024-01-01T10:00:00.000Z',
    endTime: '2024-01-01T10:01:00.000Z',
    ...overrides
  });

  describe('정상 케이스', () => {
    it('유효한 제출 데이터를 통과해야 한다', () => {
      const request = createMockRequest();
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.serverMetrics).toBeDefined();
    });

    it('클라이언트 점수와 서버 점수가 일치할 때 통과해야 한다', () => {
      const request = createMockRequest({
        clientCalculatedScore: 1243 // 실제 서버 계산 결과에 맞춤
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('기본 데이터 검증', () => {
    it('잘못된 durationSec에 대해 에러를 반환해야 한다', () => {
      const request = createMockRequest({ durationSec: 45 });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_DURATION)).toBe(true);
    });

    it('잘못된 totalQuestions에 대해 에러를 반환해야 한다', () => {
      const request = createMockRequest({ totalQuestions: 0 });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_QUESTION_COUNT)).toBe(true);
    });

    it('correctAnswers가 totalQuestions보다 클 때 에러를 반환해야 한다', () => {
      const request = createMockRequest({ correctAnswers: 15 });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_ACCURACY)).toBe(true);
    });

    it('items 배열 길이가 totalQuestions와 다를 때 에러를 반환해야 한다', () => {
      const request = createMockRequest({
        items: Array.from({ length: 5 }, (_, i) => ({
          isCorrect: i < 4,
          responseTimeMs: 3000,
          score: i < 4 ? 100 : 0
        }))
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_QUESTION_COUNT)).toBe(true);
    });
  });

  describe('허용 범위 규칙 검증', () => {
    it('잘못된 응답 시간에 대해 에러를 반환해야 한다', () => {
      const request = createMockRequest({
        items: Array.from({ length: 10 }, (_, i) => ({
          isCorrect: i < 8,
          responseTimeMs: i === 0 ? -1000 : 3000, // 첫 번째 아이템이 음수 시간
          score: i < 8 ? 100 : 0
        }))
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_RESPONSE_TIME)).toBe(true);
    });

    it('잘못된 시간 범위에 대해 에러를 반환해야 한다', () => {
      const request = createMockRequest({
        startTime: '2024-01-01T10:01:00.000Z',
        endTime: '2024-01-01T10:00:00.000Z' // endTime이 startTime보다 이전
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(e => e.code === ValidationErrorCode.INVALID_TIME_RANGE)).toBe(true);
    });
  });

  describe('의심스러운 패턴 검증', () => {
    it('모든 응답 시간이 동일할 때 의심스러운 패턴으로 감지해야 한다', () => {
      const request = createMockRequest({
        items: Array.from({ length: 10 }, (_, i) => ({
          isCorrect: i < 8,
          responseTimeMs: 3000, // 모든 응답 시간이 동일
          score: i < 8 ? 100 : 0
        }))
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ValidationErrorCode.SUSPICIOUS_PATTERN);
    });

    it('너무 빠른 응답이 많을 때 의심스러운 패턴으로 감지해야 한다', () => {
      const request = createMockRequest({
        items: Array.from({ length: 10 }, (_, i) => ({
          isCorrect: i < 8,
          responseTimeMs: i < 4 ? 300 : 3000, // 40%가 0.5초 미만
          score: i < 8 ? 100 : 0
        }))
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ValidationErrorCode.SUSPICIOUS_PATTERN);
    });

    it('완벽한 정확도에 대해 의심스러운 패턴으로 감지해야 한다', () => {
      const request = createMockRequest({
        correctAnswers: 10,
        items: Array.from({ length: 10 }, (_, i) => ({
          isCorrect: true,
          responseTimeMs: 3000 + (i * 500),
          score: 100
        }))
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ValidationErrorCode.SUSPICIOUS_PATTERN);
    });
  });

  describe('클라이언트-서버 계산 비교', () => {
    it('클라이언트 점수와 서버 점수가 크게 다를 때 에러를 반환해야 한다', () => {
      const request = createMockRequest({
        clientCalculatedScore: 2000 // 서버 계산과 크게 다른 점수
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(ValidationErrorCode.CLIENT_SERVER_MISMATCH);
    });

    it('클라이언트 점수와 서버 점수가 비슷할 때 통과해야 한다', () => {
      const request = createMockRequest({
        clientCalculatedScore: 1240 // 서버 계산과 비슷한 점수 (허용 오차 10점 내)
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('복합 검증', () => {
    it('여러 에러가 있을 때 모든 에러를 반환해야 한다', () => {
      const request = createMockRequest({
        durationSec: 45, // 잘못된 duration
        totalQuestions: 0, // 잘못된 question count
        correctAnswers: 15 // 잘못된 accuracy
      });
      const result = validateRoundSubmission(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      
      const errorCodes = result.errors.map(e => e.code);
      expect(errorCodes).toContain(ValidationErrorCode.INVALID_DURATION);
      expect(errorCodes).toContain(ValidationErrorCode.INVALID_QUESTION_COUNT);
      expect(errorCodes).toContain(ValidationErrorCode.INVALID_ACCURACY);
    });
  });
});

describe('getValidationErrorMessage', () => {
  it('빈 에러 배열에 대해 기본 메시지를 반환해야 한다', () => {
    const message = getValidationErrorMessage([]);
    expect(message).toBe('Validation passed');
  });

  it('에러 코드에 따른 한국어 메시지를 반환해야 한다', () => {
    const errors = [
      { code: ValidationErrorCode.INVALID_DURATION, message: 'Invalid duration' },
      { code: ValidationErrorCode.INVALID_QUESTION_COUNT, message: 'Invalid question count' }
    ];
    
    const message = getValidationErrorMessage(errors);
    expect(message).toContain('라운드 시간이 올바르지 않습니다');
    expect(message).toContain('문제 개수가 올바르지 않습니다');
  });

  it('알 수 없는 에러 코드에 대해 기본 메시지를 반환해야 한다', () => {
    const errors = [
      { code: 'UNKNOWN_ERROR' as ValidationErrorCode, message: 'Unknown error' }
    ];
    
    const message = getValidationErrorMessage(errors);
    expect(message).toContain('알 수 없는 검증 오류가 발생했습니다');
  });
});
