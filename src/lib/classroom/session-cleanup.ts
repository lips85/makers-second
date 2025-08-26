/**
 * 클라이언트 사이드 세션 만료 처리 유틸리티
 */

/**
 * 브라우저에서 만료된 세션을 정리하는 함수
 */
export function cleanupExpiredSession(): boolean {
  try {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('org_session='))

    if (!sessionCookie) {
      return false // 세션 없음
    }

    const sessionValue = sessionCookie.split('=')[1]
    if (!sessionValue) {
      return false
    }

    let sessionData
    try {
      sessionData = JSON.parse(decodeURIComponent(sessionValue))
    } catch (parseError) {
      // 잘못된 세션 데이터 - 쿠키 삭제
      deleteCookie('org_session')
      return true
    }

    if (!sessionData.expiresAt) {
      return false
    }

    // 만료 확인
    const expiresAt = new Date(sessionData.expiresAt)
    const now = new Date()

    if (now >= expiresAt) {
      // 만료된 세션 삭제
      deleteCookie('org_session')
      return true
    }

    return false // 아직 유효
  } catch (error) {
    console.warn('세션 만료 확인 중 오류:', error)
    return false
  }
}

/**
 * 쿠키 삭제 헬퍼 함수
 */
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

/**
 * 주기적으로 세션 만료를 확인하는 함수
 */
export function startSessionExpiryCheck(
  onSessionExpired?: () => void,
  intervalMs: number = 60000 // 1분마다 체크
): () => void {
  const intervalId = setInterval(() => {
    const wasExpired = cleanupExpiredSession()
    if (wasExpired && onSessionExpired) {
      onSessionExpired()
    }
  }, intervalMs)

  // 정리 함수 반환
  return () => clearInterval(intervalId)
}

/**
 * 페이지 포커스 시 세션 상태 확인
 */
export function setupFocusSessionCheck(onSessionExpired?: () => void) {
  const handleFocus = () => {
    const wasExpired = cleanupExpiredSession()
    if (wasExpired && onSessionExpired) {
      onSessionExpired()
    }
  }

  window.addEventListener('focus', handleFocus)
  
  // 정리 함수 반환
  return () => window.removeEventListener('focus', handleFocus)
}

/**
 * 세션 만료까지 남은 시간 계산 (밀리초)
 */
export function getSessionTimeRemaining(): number {
  try {
    const sessionCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('org_session='))

    if (!sessionCookie) {
      return 0
    }

    const sessionValue = sessionCookie.split('=')[1]
    if (!sessionValue) {
      return 0
    }

    const sessionData = JSON.parse(decodeURIComponent(sessionValue))
    if (!sessionData.expiresAt) {
      return 0
    }

    const expiresAt = new Date(sessionData.expiresAt)
    const now = new Date()
    
    return Math.max(0, expiresAt.getTime() - now.getTime())
  } catch (error) {
    console.warn('세션 만료 시간 계산 중 오류:', error)
    return 0
  }
}

/**
 * 세션 만료 알림을 위한 타이머 설정
 */
export function setupExpiryNotification(
  onWarning: (minutesRemaining: number) => void,
  onExpired: () => void,
  warningMinutes: number = 5
): () => void {
  let warningShown = false
  
  const checkExpiry = () => {
    const remaining = getSessionTimeRemaining()
    const minutesRemaining = Math.floor(remaining / (60 * 1000))

    if (remaining <= 0) {
      cleanupExpiredSession()
      onExpired()
      return
    }

    if (minutesRemaining <= warningMinutes && !warningShown) {
      warningShown = true
      onWarning(minutesRemaining)
    }
  }

  // 즉시 확인
  checkExpiry()

  // 30초마다 확인
  const intervalId = setInterval(checkExpiry, 30000)

  return () => clearInterval(intervalId)
}
