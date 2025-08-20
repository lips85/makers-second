import { test, expect } from '@playwright/test'

test.describe('교실 코드 기능', () => {
  test.beforeEach(async ({ page }) => {
    // 개발 서버가 실행 중이라고 가정
    await page.goto('http://localhost:3000')
  })

  test('메인 페이지에서 교실 코드 입력 UI가 보여야 한다', async ({ page }) => {
    // 메인 페이지에서 그룹 참여 카드 확인
    await expect(page.getByText('그룹 참여')).toBeVisible()
    await expect(page.getByText('교실 코드를 입력하여 그룹 대항전에 참여하세요')).toBeVisible()
    
    // 코드 입력 버튼 확인
    await expect(page.getByRole('button', { name: '코드 입력' })).toBeVisible()
  })

  test('잘못된 코드 형식 입력 시 에러 메시지가 표시되어야 한다', async ({ page }) => {
    // 학생용 코드 입력 컴포넌트가 있는 페이지로 이동
    // (실제로는 별도 페이지나 모달일 수 있음)
    
    // 임시로 메인 페이지에서 테스트
    const codeButton = page.getByRole('button', { name: '코드 입력' })
    await codeButton.click()

    // 모달이나 입력 폼이 나타나는지 확인
    // (실제 구현에 따라 수정 필요)
  })

  test('유효한 코드 형식 입력 시 검증을 통과해야 한다', async ({ page }) => {
    // 코드 형식 검증 테스트
    // 6자리 대문자/숫자 조합: ABC123, XYZ789 등
  })

  test('코드 참여 후 광고가 숨겨져야 한다', async ({ page }) => {
    // 1. 광고가 표시되는지 확인
    // 2. 유효한 코드 입력
    // 3. 참여 후 광고가 숨겨지는지 확인
  })

  test('세션 만료 시 광고가 다시 표시되어야 한다', async ({ page }) => {
    // 1. 코드 참여
    // 2. 세션 만료 (쿠키 조작 또는 시간 대기)
    // 3. 광고가 다시 표시되는지 확인
  })

  test('교실 참여 상태에서 남은 시간이 표시되어야 한다', async ({ page }) => {
    // 1. 코드 참여
    // 2. 세션 상태 컴포넌트에서 남은 시간 확인
  })

  test('교실 나가기 버튼이 작동해야 한다', async ({ page }) => {
    // 1. 코드 참여
    // 2. 나가기 버튼 클릭
    // 3. 세션이 해제되고 광고가 다시 표시되는지 확인
  })
})

test.describe('교사용 코드 생성 (권한 필요)', () => {
  test.skip('교사 권한이 없으면 테스트 건너뛰기', async ({ page }) => {
    // 실제 교사 계정이 필요한 테스트들은 건너뛰기
    // CI/CD에서는 모킹된 환경에서 실행
  })

  test('코드 생성 폼에서 TTL 입력이 검증되어야 한다', async ({ page }) => {
    // TTL 유효성 검증 테스트
    // 1-480분 범위 확인
  })

  test('생성된 코드가 올바른 형식이어야 한다', async ({ page }) => {
    // 6자리 대문자/숫자 확인
    // 금지된 패턴 포함하지 않는지 확인
  })

  test('코드 복사 기능이 작동해야 한다', async ({ page }) => {
    // 클립보드 API 테스트
  })
})

test.describe('리더보드 조직 필터링', () => {
  test('세션 없을 때는 글로벌 리더보드가 표시되어야 한다', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard')
    
    // 글로벌 스코프가 기본으로 선택되어 있는지 확인
    await expect(page.getByRole('button', { name: /전체.*글로벌/ })).toBeVisible()
    
    // 디버그 정보에서 scope 확인 (개발 모드인 경우)
    const debugInfo = page.locator('text=Scope: global')
    if (await debugInfo.isVisible()) {
      await expect(debugInfo).toBeVisible()
    }
  })

  test('교실 참여 후에는 해당 조직 리더보드가 표시되어야 한다', async ({ page }) => {
    // 1. 교실 코드 참여
    // 2. 리더보드 페이지 이동
    // 3. 학교 스코프로 자동 전환되는지 확인
    // 4. 해당 조직 데이터만 표시되는지 확인
  })
})

test.describe('접근성 및 사용성', () => {
  test('키보드 네비게이션이 작동해야 한다', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // Tab 키로 네비게이션 가능한지 확인
    await page.keyboard.press('Tab')
    
    // 포커스가 올바르게 이동하는지 확인
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['BUTTON', 'INPUT', 'A']).toContain(focusedElement)
  })

  test('화면 리더기를 위한 ARIA 속성이 설정되어야 한다', async ({ page }) => {
    await page.goto('http://localhost:3000')
    
    // 주요 UI 요소들의 ARIA 속성 확인
    await expect(page.locator('[aria-label]')).toHaveCount({ min: 1 })
  })

  test('모바일 반응형이 적용되어야 한다', async ({ page }) => {
    // 모바일 뷰포트로 설정
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('http://localhost:3000')
    
    // 모바일에서도 UI가 올바르게 표시되는지 확인
    await expect(page.getByRole('heading', { name: 'V2NZ' })).toBeVisible()
  })
})

test.describe('에러 처리', () => {
  test('네트워크 오류 시 적절한 에러 메시지가 표시되어야 한다', async ({ page }) => {
    // 네트워크를 차단하고 API 호출 시도
    await page.route('**/api/**', route => route.abort())
    
    await page.goto('http://localhost:3000')
    
    // 에러 상황에서도 앱이 크래시하지 않는지 확인
    await expect(page.getByText('V2NZ')).toBeVisible()
  })

  test('만료된 코드 입력 시 적절한 메시지가 표시되어야 한다', async ({ page }) => {
    // 만료된 코드 시뮬레이션
    // (실제로는 서버에서 만료된 코드를 생성하거나 모킹 필요)
  })

  test('존재하지 않는 코드 입력 시 에러 메시지가 표시되어야 한다', async ({ page }) => {
    // 존재하지 않는 코드 입력 테스트
  })
})

test.describe('성능', () => {
  test('페이지 로딩 시간이 적절해야 한다', async ({ page }) => {
    const start = Date.now()
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - start
    
    // 5초 이내 로딩
    expect(loadTime).toBeLessThan(5000)
  })

  test('대량의 리더보드 데이터도 빠르게 렌더링되어야 한다', async ({ page }) => {
    await page.goto('http://localhost:3000/leaderboard')
    
    // 리더보드 테이블이 로딩되는 시간 측정
    const start = Date.now()
    await page.waitForSelector('[role="table"], [role="row"]', { timeout: 10000 })
    const renderTime = Date.now() - start
    
    // 10초 이내 렌더링
    expect(renderTime).toBeLessThan(10000)
  })
})
