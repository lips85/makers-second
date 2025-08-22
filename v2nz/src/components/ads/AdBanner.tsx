"use client";

import { useEffect, useState } from "react";
import { useAdsVisibility } from "@/hooks/useAdsVisibility";
import {
  loadGoogleAdsScript,
  getGoogleAdsLoadStatus,
} from "@/lib/ads/google-ads-loader";
import { AdErrorBoundary, DefaultAdFallback } from "./AdErrorBoundary";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  position?: "top" | "bottom" | "sidebar";
  size?: "small" | "medium" | "large";
  className?: string;
  adUnitId?: string;
}

/**
 * 광고 배너 컴포넌트
 * - Google Ads SDK 비동기 로드
 * - React.lazy + Error Boundary 적용
 * - 조직 세션 기반 광고 숨김
 */
export function AdBanner({
  position = "bottom",
  size = "medium",
  className,
  adUnitId,
}: AdBannerProps) {
  const { shouldShowAds } = useAdsVisibility();
  const [isAdsLoaded, setIsAdsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  // Google Ads SDK 로드
  useEffect(() => {
    if (!shouldShowAds) return;

    const loadAds = async () => {
      try {
        const success = await loadGoogleAdsScript();
        setIsAdsLoaded(success);
      } catch (error) {
        console.error("광고 로드 실패:", error);
        setLoadError(error as Error);
      }
    };

    loadAds();
  }, [shouldShowAds]);

  // 세션이 활성화되어 광고를 숨겨야 하는 경우 null 반환
  if (!shouldShowAds) {
    return null;
  }

  // 위치와 크기에 따른 스타일 계산
  const sizeStyles = {
    small: "h-16",
    medium: "h-24",
    large: "h-32",
  };

  const positionStyles = {
    top: "fixed top-0 left-0 right-0 z-40",
    bottom: "fixed bottom-0 left-0 right-0 z-40",
    sidebar: "sticky top-4",
  };

  return (
    <AdErrorBoundary fallback={DefaultAdFallback}>
      <div
        className={cn(
          "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700",
          "flex items-center justify-center",
          "transition-all duration-300",
          sizeStyles[size],
          positionStyles[position],
          className
        )}
        role="banner"
        aria-label="광고"
      >
        {loadError ? (
          <DefaultAdFallback error={loadError} />
        ) : !isAdsLoaded ? (
          // 로딩 중 상태
          <div className="text-center p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              광고 로딩 중...
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              잠시만 기다려주세요
            </div>
          </div>
        ) : (
          // 실제 광고 슬롯
          <div
            id={`ad-banner-${position}-${size}`}
            className="w-full h-full"
            data-ad-position={position}
            data-ad-size={size}
            data-ad-unit={adUnitId}
          />
        )}
      </div>
    </AdErrorBoundary>
  );
}

/**
 * 사이드바 광고 컴포넌트
 */
export function SidebarAd({
  className,
  adUnitId,
}: {
  className?: string;
  adUnitId?: string;
}) {
  return (
    <AdBanner
      position="sidebar"
      size="large"
      adUnitId={adUnitId}
      className={cn("w-full max-w-xs", className)}
    />
  );
}

/**
 * 상단 배너 광고 컴포넌트
 */
export function TopBanner({
  className,
  adUnitId,
}: {
  className?: string;
  adUnitId?: string;
}) {
  return (
    <AdBanner
      position="top"
      size="small"
      adUnitId={adUnitId}
      className={className}
    />
  );
}

/**
 * 하단 배너 광고 컴포넌트
 */
export function BottomBanner({
  className,
  adUnitId,
}: {
  className?: string;
  adUnitId?: string;
}) {
  return (
    <AdBanner
      position="bottom"
      size="medium"
      adUnitId={adUnitId}
      className={className}
    />
  );
}

/**
 * 콘텐츠 사이 광고 컴포넌트
 */
export function InlineAd({
  className,
  adUnitId,
}: {
  className?: string;
  adUnitId?: string;
}) {
  const { shouldShowAds } = useAdsVisibility();

  if (!shouldShowAds) {
    return null;
  }

  return (
    <AdErrorBoundary fallback={DefaultAdFallback}>
      <div
        className={cn(
          "w-full py-8 my-8",
          "bg-gray-50 dark:bg-gray-900",
          "border-y border-gray-200 dark:border-gray-700",
          "flex items-center justify-center",
          className
        )}
        role="banner"
        aria-label="광고"
      >
        <div
          id={`ad-inline-${adUnitId || "default"}`}
          className="w-full h-24"
          data-ad-unit={adUnitId}
        />
      </div>
    </AdErrorBoundary>
  );
}
