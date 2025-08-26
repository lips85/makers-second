import { env } from "@/lib/env";

// Google Ads SDK 로드 상태
let isGoogleAdsLoaded = false;
let loadPromise: Promise<boolean> | null = null;

/**
 * Google Ads SDK를 비동기적으로 로드
 * - 멱등적으로 동작하여 한 번만 로드
 * - 환경변수 미설정 시 안전하게 중단
 * - Promise로 성공/실패 상태 전달
 */
export async function loadGoogleAdsScript(): Promise<boolean> {
  // 이미 로드된 경우
  if (isGoogleAdsLoaded) {
    return true;
  }

  // 이미 로딩 중인 경우 기존 Promise 반환
  if (loadPromise) {
    return loadPromise;
  }

  // 환경변수 확인
  const clientId = env.NEXT_PUBLIC_GADS_CLIENT_ID;
  if (!clientId) {
    console.warn(
      "Google Ads: NEXT_PUBLIC_GADS_CLIENT_ID가 설정되지 않았습니다."
    );
    return false;
  }

  // 브라우저 환경 확인
  if (typeof window === "undefined") {
    console.warn("Google Ads: 서버 사이드에서는 로드할 수 없습니다.");
    return false;
  }

  // 이미 스크립트가 존재하는지 확인
  const existingScript = document.querySelector(
    'script[src*="googletagmanager.com"]'
  );
  if (existingScript) {
    isGoogleAdsLoaded = true;
    return true;
  }

  // 새로운 로드 Promise 생성
  loadPromise = new Promise<boolean>((resolve, reject) => {
    try {
      // Google Ads 스크립트 생성
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${clientId}`;
      script.onload = () => {
        // gtag 함수 초기화
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        gtag("js", new Date());
        gtag("config", clientId, {
          page_title: document.title,
          page_location: window.location.href,
        });

        isGoogleAdsLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error("Google Ads: 스크립트 로드 실패");
        reject(new Error("Google Ads 스크립트 로드 실패"));
      };

      // 스크립트 삽입
      document.head.appendChild(script);

      // 타임아웃 설정 (10초)
      setTimeout(() => {
        if (!isGoogleAdsLoaded) {
          reject(new Error("Google Ads 스크립트 로드 타임아웃"));
        }
      }, 10000);
    } catch (error) {
      console.error("Google Ads: 초기화 오류", error);
      reject(error);
    }
  });

  return loadPromise;
}

/**
 * Google Ads SDK 로드 상태 확인
 */
export function getGoogleAdsLoadStatus(): boolean {
  return isGoogleAdsLoaded;
}

/**
 * Google Ads SDK 재설정 (테스트용)
 */
export function resetGoogleAdsLoader(): void {
  isGoogleAdsLoaded = false;
  loadPromise = null;
}

// TypeScript 전역 타입 확장
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}
