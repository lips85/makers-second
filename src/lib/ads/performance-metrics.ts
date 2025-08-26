/**
 * 광고 관련 성능 메트릭 수집 유틸리티
 */

// 성능 마크 이름들
const PERFORMANCE_MARKS = {
  ADS_SCRIPT_START: "ads-script-load-start",
  ADS_SCRIPT_END: "ads-script-load-end",
  ADS_SLOT_START: "ads-slot-init-start",
  ADS_SLOT_END: "ads-slot-init-end",
  FCP: "first-contentful-paint",
} as const;

/**
 * 성능 마크 시작
 */
export function startPerformanceMark(
  markName: keyof typeof PERFORMANCE_MARKS
): void {
  if (typeof window === "undefined") return;

  try {
    performance.mark(PERFORMANCE_MARKS[markName]);
  } catch (error) {
    console.warn("성능 마크 시작 실패:", markName, error);
  }
}

/**
 * 성능 마크 종료
 */
export function endPerformanceMark(
  markName: keyof typeof PERFORMANCE_MARKS
): void {
  if (typeof window === "undefined") return;

  try {
    performance.mark(PERFORMANCE_MARKS[markName]);
  } catch (error) {
    console.warn("성능 마크 종료 실패:", markName, error);
  }
}

/**
 * 성능 측정
 */
export function measurePerformance(
  measureName: string,
  startMark: keyof typeof PERFORMANCE_MARKS,
  endMark: keyof typeof PERFORMANCE_MARKS
): PerformanceEntry | null {
  if (typeof window === "undefined") return null;

  try {
    const measure = performance.measure(
      measureName,
      PERFORMANCE_MARKS[startMark],
      PERFORMANCE_MARKS[endMark]
    );

    // 측정 결과 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.log(`성능 측정 - ${measureName}:`, {
        duration: measure.duration,
        startTime: measure.startTime,
        endTime: measure.endTime,
      });
    }

    return measure;
  } catch (error) {
    console.warn("성능 측정 실패:", measureName, error);
    return null;
  }
}

/**
 * FCP 이후 광고 로드 확인
 */
export function ensureAdsLoadAfterFCP(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    // FCP가 이미 발생했는지 확인
    const fcpEntry = performance.getEntriesByName("first-contentful-paint")[0];
    if (fcpEntry) {
      resolve();
      return;
    }

    // FCP 대기
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          observer.disconnect();
          resolve();
          return;
        }
      }
    });

    observer.observe({ entryTypes: ["paint"] });

    // 타임아웃 설정 (5초)
    setTimeout(() => {
      observer.disconnect();
      resolve();
    }, 5000);
  });
}

/**
 * 광고 성능 메트릭 수집
 */
export function collectAdsMetrics(): {
  scriptLoadTime?: number;
  slotInitTime?: number;
  fcpTime?: number;
  adsLoadAfterFCP: boolean;
} {
  if (typeof window === "undefined") {
    return { adsLoadAfterFCP: false };
  }

  try {
    // 스크립트 로드 시간 측정
    const scriptMeasure = performance.getEntriesByName(
      "ads-script-load"
    )[0] as PerformanceMeasure;
    const scriptLoadTime = scriptMeasure?.duration;

    // 슬롯 초기화 시간 측정
    const slotMeasure = performance.getEntriesByName(
      "ads-slot-init"
    )[0] as PerformanceMeasure;
    const slotInitTime = slotMeasure?.duration;

    // FCP 시간
    const fcpEntry = performance.getEntriesByName(
      "first-contentful-paint"
    )[0] as PerformanceEntry;
    const fcpTime = fcpEntry?.startTime;

    // FCP 이후 광고 로드 여부 확인
    const adsLoadAfterFCP =
      !fcpTime || (scriptMeasure?.startTime || 0) > fcpTime;

    return {
      scriptLoadTime,
      slotInitTime,
      fcpTime,
      adsLoadAfterFCP,
    };
  } catch (error) {
    console.warn("광고 메트릭 수집 실패:", error);
    return { adsLoadAfterFCP: false };
  }
}

/**
 * 성능 메트릭을 분석 도구로 전송 (선택적)
 */
export function sendAdsMetrics(
  metrics: ReturnType<typeof collectAdsMetrics>
): void {
  // 개발 환경에서만 로깅
  if (process.env.NODE_ENV === "development") {
    console.log("광고 성능 메트릭:", metrics);
  }

  // 프로덕션에서는 분석 도구로 전송 가능
  if (process.env.NODE_ENV === "production" && typeof window !== "undefined") {
    // Google Analytics, Sentry 등으로 전송
    if (window.gtag) {
      window.gtag("event", "ads_performance", {
        script_load_time: metrics.scriptLoadTime,
        slot_init_time: metrics.slotInitTime,
        fcp_time: metrics.fcpTime,
        ads_load_after_fcp: metrics.adsLoadAfterFCP,
      });
    }
  }
}
