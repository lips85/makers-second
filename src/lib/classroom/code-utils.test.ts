import {
  generateClassCode,
  validateTTL,
  validateCodeFormat,
  calculateExpiresAt,
  isCodeExpired,
  getRemainingMinutes,
  normalizeErrorMessage,
  TTLSchema,
  ClassCodeSchema
} from './code-utils'

describe('교실 코드 유틸리티', () => {
  describe('generateClassCode', () => {
    it('6자리 코드를 생성해야 한다', () => {
      const code = generateClassCode()
      expect(code).toHaveLength(6)
    })

    it('대문자와 숫자만 포함해야 한다', () => {
      const code = generateClassCode()
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })

    it('혼동 가능한 문자를 포함하지 않아야 한다', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateClassCode()
        expect(code).not.toMatch(/[IL0O]/)
      }
    })

    it('금지된 패턴을 포함하지 않아야 한다', () => {
      for (let i = 0; i < 100; i++) {
        const code = generateClassCode()
        expect(code).not.toMatch(/FUCK|SHIT|DAMN|HELL|BITCH|ASSHOLE|STUPID/)
      }
    })

    it('서로 다른 코드를 생성해야 한다', () => {
      const codes = new Set()
      for (let i = 0; i < 100; i++) {
        codes.add(generateClassCode())
      }
      expect(codes.size).toBeGreaterThan(90) // 높은 확률로 중복 없어야 함
    })
  })

  describe('validateTTL', () => {
    it('유효한 TTL을 승인해야 한다', () => {
      expect(validateTTL(1)).toEqual({ isValid: true })
      expect(validateTTL(60)).toEqual({ isValid: true })
      expect(validateTTL(480)).toEqual({ isValid: true })
    })

    it('최소값 미만을 거부해야 한다', () => {
      const result = validateTTL(0)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('최소 1분')
    })

    it('최대값 초과를 거부해야 한다', () => {
      const result = validateTTL(481)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('최대 480분')
    })

    it('정수가 아닌 값을 거부해야 한다', () => {
      const result = validateTTL(1.5)
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('정수')
    })
  })

  describe('validateCodeFormat', () => {
    it('유효한 코드를 승인해야 한다', () => {
      expect(validateCodeFormat('ABC123')).toEqual({ isValid: true })
      expect(validateCodeFormat('xyz789')).toEqual({ isValid: true }) // 대문자 변환
    })

    it('잘못된 길이를 거부해야 한다', () => {
      const result = validateCodeFormat('ABC12')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('6자리')
    })

    it('잘못된 문자를 거부해야 한다', () => {
      const result = validateCodeFormat('ABC12!')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('대문자와 숫자')
    })

    it('금지된 패턴을 거부해야 한다', () => {
      const result = validateCodeFormat('FUCK12')
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('사용할 수 없는')
    })
  })

  describe('calculateExpiresAt', () => {
    it('정확한 만료 시각을 계산해야 한다', () => {
      const now = new Date()
      const ttl = 60 // 60분
      const expiresAt = calculateExpiresAt(ttl)
      
      const expectedTime = now.getTime() + ttl * 60 * 1000
      const actualTime = expiresAt.getTime()
      
      // 1초 오차 허용
      expect(Math.abs(actualTime - expectedTime)).toBeLessThan(1000)
    })
  })

  describe('isCodeExpired', () => {
    it('미래 시각은 만료되지 않았다고 판단해야 한다', () => {
      const futureDate = new Date(Date.now() + 60000) // 1분 후
      expect(isCodeExpired(futureDate)).toBe(false)
    })

    it('과거 시각은 만료되었다고 판단해야 한다', () => {
      const pastDate = new Date(Date.now() - 60000) // 1분 전
      expect(isCodeExpired(pastDate)).toBe(true)
    })
  })

  describe('getRemainingMinutes', () => {
    it('정확한 남은 시간을 계산해야 한다', () => {
      const future = new Date(Date.now() + 120000) // 2분 후
      const remaining = getRemainingMinutes(future)
      expect(remaining).toBe(2)
    })

    it('만료된 코드는 0을 반환해야 한다', () => {
      const past = new Date(Date.now() - 60000) // 1분 전
      const remaining = getRemainingMinutes(past)
      expect(remaining).toBe(0)
    })
  })

  describe('normalizeErrorMessage', () => {
    it('영어 에러를 한국어로 변환해야 한다', () => {
      expect(normalizeErrorMessage('Invalid code')).toBe('잘못된 코드입니다')
      expect(normalizeErrorMessage('Code has expired')).toBe('코드가 만료되었습니다')
      expect(normalizeErrorMessage('Code not found')).toBe('코드를 찾을 수 없습니다')
    })

    it('매핑되지 않은 에러는 원본을 반환해야 한다', () => {
      const originalError = 'Some unknown error'
      expect(normalizeErrorMessage(originalError)).toBe(originalError)
    })
  })

  describe('Zod 스키마', () => {
    it('TTLSchema가 올바르게 작동해야 한다', () => {
      expect(() => TTLSchema.parse(60)).not.toThrow()
      expect(() => TTLSchema.parse(0)).toThrow()
      expect(() => TTLSchema.parse(481)).toThrow()
    })

    it('ClassCodeSchema가 올바르게 작동해야 한다', () => {
      expect(() => ClassCodeSchema.parse('ABC123')).not.toThrow()
      expect(() => ClassCodeSchema.parse('abc123')).toThrow() // 소문자 거부
      expect(() => ClassCodeSchema.parse('ABC12')).toThrow() // 길이 부족
    })
  })
})
