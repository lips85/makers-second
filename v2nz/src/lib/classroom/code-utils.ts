import { z } from 'zod'

// 금지된 문자 패턴 (욕설, 혼동 가능한 문자 등)
const FORBIDDEN_PATTERNS = [
  /[IL0O]/g, // 혼동 가능한 문자 (I, L, 0, O)
  /FUCK/g,
  /SHIT/g,
  /DAMN/g,
  /HELL/g,
  /BITCH/g,
  /ASSHOLE/g,
  /STUPID/g,
]

// TTL 스키마 (1분 ~ 480분 = 8시간)
export const TTLSchema = z.number()
  .int('TTL은 정수여야 합니다')
  .min(1, 'TTL은 최소 1분이어야 합니다')
  .max(480, 'TTL은 최대 480분(8시간)이어야 합니다')

// 교실 코드 스키마
export const ClassCodeSchema = z.string()
  .length(6, '교실 코드는 6자리여야 합니다')
  .regex(/^[A-Z0-9]{6}$/, '교실 코드는 대문자와 숫자만 포함해야 합니다')

// 코드 생성 옵션
export interface GenerateCodeOptions {
  ttlMinutes: number
  maxRetries?: number
}

// 코드 검증 결과
export interface ValidateCodeResult {
  isValid: boolean
  orgId?: string
  expiresAt?: Date
  errorMessage?: string
}

/**
 * 6자리 교실 코드 생성
 * - 대문자 A-Z와 숫자 1-9 사용 (혼동 방지용)
 * - 금지된 패턴 포함 시 재생성
 */
export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ123456789' // I, L, O, 0 제외
  let code: string

  do {
    code = Array.from({ length: 6 }, () => 
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
  } while (containsForbiddenPattern(code))

  return code
}

/**
 * 금지된 패턴 검사
 */
function containsForbiddenPattern(code: string): boolean {
  return FORBIDDEN_PATTERNS.some(pattern => pattern.test(code))
}

/**
 * TTL 유효성 검증
 */
export function validateTTL(ttlMinutes: number): { isValid: boolean; error?: string } {
  try {
    TTLSchema.parse(ttlMinutes)
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || 'Invalid TTL'
      }
    }
    return {
      isValid: false,
      error: 'Unknown validation error'
    }
  }
}

/**
 * 코드 형식 검증
 */
export function validateCodeFormat(code: string): { isValid: boolean; error?: string } {
  try {
    ClassCodeSchema.parse(code.toUpperCase())
    
    if (containsForbiddenPattern(code.toUpperCase())) {
      return {
        isValid: false,
        error: '사용할 수 없는 코드입니다'
      }
    }
    
    return { isValid: true }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        error: error.issues[0]?.message || 'Invalid code format'
      }
    }
    return {
      isValid: false,
      error: 'Unknown validation error'
    }
  }
}

/**
 * 만료 시각 계산
 */
export function calculateExpiresAt(ttlMinutes: number): Date {
  const now = new Date()
  return new Date(now.getTime() + ttlMinutes * 60 * 1000)
}

/**
 * 코드가 만료되었는지 확인
 */
export function isCodeExpired(expiresAt: Date): boolean {
  return new Date() > expiresAt
}

/**
 * 남은 시간을 분 단위로 계산
 */
export function getRemainingMinutes(expiresAt: Date): number {
  const now = new Date()
  const remaining = expiresAt.getTime() - now.getTime()
  return Math.max(0, Math.floor(remaining / (60 * 1000)))
}

/**
 * 에러 메시지 정규화
 */
export function normalizeErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'Invalid code': '잘못된 코드입니다',
    'Code has expired': '코드가 만료되었습니다',
    'Code is inactive': '비활성화된 코드입니다',
    'Code not found': '코드를 찾을 수 없습니다'
  }
  
  return errorMap[error] || error
}
