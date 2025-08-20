import { OrgSession } from '@/hooks/useOrgSession'

/**
 * 조직 세션에 기반한 필터 설정
 */
export interface OrgFilterConfig {
  scope: 'global' | 'school'
  orgId?: string
  sessionBased: boolean
}

/**
 * 세션 상태에 따라 조직 필터를 결정하는 함수
 */
export function getOrgFilterFromSession(
  session: OrgSession | null,
  userPreference?: { scope: 'global' | 'school'; orgId?: string }
): OrgFilterConfig {
  // 세션이 활성화된 경우
  if (session) {
    return {
      scope: 'school',
      orgId: session.orgId,
      sessionBased: true
    }
  }

  // 세션이 없는 경우 사용자 선택 또는 기본값 사용
  return {
    scope: userPreference?.scope || 'global',
    orgId: userPreference?.orgId,
    sessionBased: false
  }
}

/**
 * API 헤더에 조직 세션 정보를 추가하는 함수
 */
export function addOrgSessionHeaders(
  headers: Record<string, string> = {},
  session: OrgSession | null
): Record<string, string> {
  if (session) {
    return {
      ...headers,
      'X-Org-Session': JSON.stringify({
        orgId: session.orgId,
        expiresAt: session.expiresAt
      })
    }
  }
  
  return headers
}

/**
 * 서버 사이드에서 쿠키를 파싱하여 조직 세션을 가져오는 함수
 */
export function parseOrgSessionFromCookie(cookieValue: string | undefined): OrgSession | null {
  if (!cookieValue) {
    return null
  }

  try {
    const sessionData = JSON.parse(cookieValue)
    
    // 필수 필드 검증
    if (!sessionData.orgId || !sessionData.expiresAt) {
      return null
    }

    // 만료 확인
    const expiresAt = new Date(sessionData.expiresAt)
    const now = new Date()
    
    if (now >= expiresAt) {
      return null // 만료된 세션
    }

    return {
      orgId: sessionData.orgId,
      orgName: sessionData.orgName || '',
      expiresAt: sessionData.expiresAt,
      adsHidden: sessionData.adsHidden || false,
      joinedAt: sessionData.joinedAt || new Date().toISOString()
    }
  } catch (error) {
    console.warn('조직 세션 쿠키 파싱 실패:', error)
    return null
  }
}

/**
 * 클라이언트에서 조직 세션 기반으로 쿼리 파라미터를 생성하는 함수
 */
export function buildOrgQueryParams(session: OrgSession | null): URLSearchParams {
  const params = new URLSearchParams()
  
  if (session) {
    params.set('orgSession', 'true')
    params.set('orgId', session.orgId)
    // 보안을 위해 만료 시간도 전송하여 서버에서 재검증
    params.set('expiresAt', session.expiresAt)
  }
  
  return params
}

/**
 * 조직 필터가 적용된 Supabase 쿼리 빌더를 위한 헬퍼
 */
export function applyOrgFilter<T>(
  queryBuilder: any, // Supabase query builder
  filterConfig: OrgFilterConfig
): any {
  if (filterConfig.scope === 'school' && filterConfig.orgId) {
    return queryBuilder.eq('org_id', filterConfig.orgId)
  }
  
  // 글로벌 스코프인 경우 필터 적용하지 않음
  return queryBuilder
}

/**
 * 세션 만료 시간 검증 함수
 */
export function validateSessionExpiry(session: OrgSession | null): boolean {
  if (!session) {
    return false
  }

  const expiresAt = new Date(session.expiresAt)
  const now = new Date()
  
  return now < expiresAt
}

/**
 * 조직 기반 캐시 키 생성 함수
 */
export function generateOrgCacheKey(
  baseKey: string[],
  session: OrgSession | null
): string[] {
  if (session) {
    return [...baseKey, 'org', session.orgId]
  }
  
  return [...baseKey, 'global']
}
