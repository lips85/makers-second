import { useEffect, useState } from "react";
import { useOrgSession } from "./useOrgSession";
import { env } from "@/lib/env";

/**
 * 광고 표시 여부를 결정하는 훅
 * - 조직 세션 상태
 * - URL 파라미터
 * - 환경변수 설정
 * - 쿠키 상태를 종합적으로 고려
 */
export function useAdsVisibility() {
  const { adsHidden, isActive } = useOrgSession();
  const [urlParamsHidden, setUrlParamsHidden] = useState(false);

  // URL 파라미터 확인
  useEffect(() => {
    if (typeof window === "undefined") return;

    const urlParams = new URLSearchParams(window.location.search);
    const hasOrgParam = urlParams.has("org") || urlParams.has("classroom");

    setUrlParamsHidden(hasOrgParam);
  }, []);

  // 강제 비활성 환경변수 확인
  const forceDisabled = env.NEXT_PUBLIC_FORCE_ADS_DISABLED;

  // 광고 숨김 조건들
  const shouldHideAds =
    forceDisabled || // 강제 비활성
    (isActive && adsHidden) || // 조직 세션에서 광고 숨김
    urlParamsHidden; // URL 파라미터로 인한 숨김

  return {
    shouldHideAds,
    shouldShowAds: !shouldHideAds,
    forceDisabled,
    urlParamsHidden,
    sessionHidden: isActive && adsHidden,
  };
}
