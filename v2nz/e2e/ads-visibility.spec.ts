import { test, expect } from "@playwright/test";

test.describe("광고 표시/숨김 기능", () => {
  test.beforeEach(async ({ page }) => {
    // 기본 페이지로 이동
    await page.goto("/");
  });

  test("기본 상태에서 광고가 표시되어야 함", async ({ page }) => {
    // 결과 모달을 열기 위해 게임을 시작
    await page.click("text=게임 시작");

    // 게임이 끝날 때까지 대기 (타이머가 0이 될 때까지)
    await page.waitForFunction(
      () => {
        const timer = document.querySelector('[data-testid="timer"]');
        return timer && timer.textContent === "0";
      },
      { timeout: 10000 }
    );

    // 결과 모달이 나타날 때까지 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // 광고 배너가 표시되어야 함
    const adBanner = page.locator('[role="banner"]');
    await expect(adBanner).toBeVisible();

    // 광고 영역이 렌더링되어야 함
    const adContainer = page.locator("#ad-banner-bottom-medium");
    await expect(adContainer).toBeVisible();
  });

  test("교실 코드 입력 시 광고가 숨겨져야 함", async ({ page }) => {
    // 교실 코드 입력
    await page.fill('input[placeholder*="코드"]', "TEST123");
    await page.click('button:has-text("참여")');

    // 참여 성공 메시지 대기
    await page.waitForSelector("text=교실에 참여했습니다", { timeout: 5000 });

    // 결과 모달을 열기 위해 게임을 시작
    await page.click("text=게임 시작");

    // 게임이 끝날 때까지 대기
    await page.waitForFunction(
      () => {
        const timer = document.querySelector('[data-testid="timer"]');
        return timer && timer.textContent === "0";
      },
      { timeout: 10000 }
    );

    // 결과 모달이 나타날 때까지 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // 광고 배너가 숨겨져야 함
    const adBanner = page.locator('[role="banner"]');
    await expect(adBanner).not.toBeVisible();
  });

  test("URL 파라미터로 광고가 숨겨져야 함", async ({ page }) => {
    // org 파라미터와 함께 페이지 접속
    await page.goto("/?org=TEST123");

    // 결과 모달을 열기 위해 게임을 시작
    await page.click("text=게임 시작");

    // 게임이 끝날 때까지 대기
    await page.waitForFunction(
      () => {
        const timer = document.querySelector('[data-testid="timer"]');
        return timer && timer.textContent === "0";
      },
      { timeout: 10000 }
    );

    // 결과 모달이 나타날 때까지 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // 광고 배너가 숨겨져야 함
    const adBanner = page.locator('[role="banner"]');
    await expect(adBanner).not.toBeVisible();
  });

  test("광고 로드 실패 시 에러 폴백이 표시되어야 함", async ({ page }) => {
    // 광고 스크립트 로드를 차단하는 모의 설정
    await page.route("**/googletagmanager.com/**", (route) => {
      route.abort("failed");
    });

    // 결과 모달을 열기 위해 게임을 시작
    await page.click("text=게임 시작");

    // 게임이 끝날 때까지 대기
    await page.waitForFunction(
      () => {
        const timer = document.querySelector('[data-testid="timer"]');
        return timer && timer.textContent === "0";
      },
      { timeout: 10000 }
    );

    // 결과 모달이 나타날 때까지 대기
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });

    // 에러 폴백이 표시되어야 함
    const errorFallback = page.locator("text=광고를 불러올 수 없습니다");
    await expect(errorFallback).toBeVisible();

    // 페이지가 크래시되지 않아야 함
    await expect(page.locator("body")).toBeVisible();
  });
});
