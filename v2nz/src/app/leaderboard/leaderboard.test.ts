import { test, expect } from '@playwright/test'

test.describe('Leaderboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // 리더보드 페이지로 이동
    await page.goto('/leaderboard')
  })

  test('should display leaderboard page with basic elements', async ({ page }) => {
    // 기본 요소들이 표시되는지 확인
    await expect(page.getByRole('heading', { name: '리더보드' })).toBeVisible()
    await expect(page.getByRole('button', { name: '홈으로' })).toBeVisible()
    await expect(page.getByRole('button', { name: '새로고침' })).toBeVisible()
  })

  test('should show scope toggle buttons', async ({ page }) => {
    // 스코프 토글 버튼들이 표시되는지 확인
    await expect(page.getByRole('button', { name: /전체/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /학교/ })).toBeVisible()
  })

  test('should switch between global and school scope', async ({ page }) => {
    // 전체 스코프가 기본으로 선택되어 있는지 확인
    const globalButton = page.getByRole('button', { name: /전체/ })
    const schoolButton = page.getByRole('button', { name: /학교/ })
    
    await expect(globalButton).toHaveAttribute('data-state', 'active')
    
    // 학교 스코프로 전환
    await schoolButton.click()
    await expect(schoolButton).toHaveAttribute('data-state', 'active')
    await expect(globalButton).not.toHaveAttribute('data-state', 'active')
    
    // URL이 업데이트되었는지 확인
    await expect(page).toHaveURL(/scope=school/)
  })

  test('should show organization selector when school scope is selected', async ({ page }) => {
    // 학교 스코프 선택
    await page.getByRole('button', { name: /학교/ }).click()
    
    // 조직 선택기가 표시되는지 확인
    await expect(page.getByRole('combobox')).toBeVisible()
    await expect(page.getByText('모든 학교')).toBeVisible()
  })

  test('should display loading state initially', async ({ page }) => {
    // 초기 로딩 상태가 표시되는지 확인
    await expect(page.getByText(/리더보드 로딩 중/)).toBeVisible()
  })

  test('should handle empty leaderboard state', async ({ page }) => {
    // 빈 상태가 표시되는지 확인 (데이터가 없는 경우)
    await expect(page.getByText(/아직 순위 데이터가 없습니다/)).toBeVisible()
  })

  test('should show my rank bar', async ({ page }) => {
    // 내 순위 바가 표시되는지 확인
    await expect(page.getByText(/순위 정보가 없습니다/)).toBeVisible()
  })

  test('should refresh leaderboard data', async ({ page }) => {
    // 새로고침 버튼 클릭
    await page.getByRole('button', { name: '새로고침' }).click()
    
    // 로딩 상태가 다시 표시되는지 확인
    await expect(page.getByText(/리더고치/)).toBeVisible()
  })

  test('should show realtime connection indicator', async ({ page }) => {
    // 실시간 연결 표시기가 표시되는지 확인
    await expect(page.getByText('실시간')).toBeVisible()
  })

  test('should have proper accessibility attributes', async ({ page }) => {
    // 접근성 속성들이 올바르게 설정되어 있는지 확인
    await expect(page.getByRole('table')).toBeVisible()
    await expect(page.getByRole('columnheader')).toHaveCount(5) // 순위, 사용자, 총점, 라운드, 성취도
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // 키보드 네비게이션이 작동하는지 확인
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: '홈으로' })).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.getByRole('button', { name: /전체/ })).toBeFocused()
  })

  test('should update URL when scope changes', async ({ page }) => {
    // 스코프 변경 시 URL이 업데이트되는지 확인
    await page.getByRole('button', { name: /학교/ }).click()
    await expect(page).toHaveURL(/scope=school/)
    
    await page.getByRole('button', { name: /전체/ }).click()
    await expect(page).toHaveURL(/\/leaderboard$/)
  })

  test('should show debug information in development mode', async ({ page }) => {
    // 개발 모드에서 디버그 정보가 표시되는지 확인
    await expect(page.getByText('디버그 정보')).toBeVisible()
    await expect(page.getByText(/Scope:/)).toBeVisible()
    await expect(page.getByText(/Org ID:/)).toBeVisible()
    await expect(page.getByText(/Viewer ID:/)).toBeVisible()
  })
})
