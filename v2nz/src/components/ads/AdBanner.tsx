'use client'

import { useAdsVisibility } from '@/hooks/useOrgSession'
import { cn } from '@/lib/utils'

interface AdBannerProps {
  position?: 'top' | 'bottom' | 'sidebar'
  size?: 'small' | 'medium' | 'large'
  className?: string
}

/**
 * 광고 배너 컴포넌트
 * - 조직 세션이 활성화된 경우 자동으로 숨겨짐
 * - 다양한 위치와 크기 지원
 */
export function AdBanner({ 
  position = 'bottom', 
  size = 'medium',
  className 
}: AdBannerProps) {
  const { shouldShowAds } = useAdsVisibility()

  // 세션이 활성화되어 광고를 숨겨야 하는 경우 null 반환
  if (!shouldShowAds) {
    return null
  }

  // 위치와 크기에 따른 스타일 계산
  const sizeStyles = {
    small: 'h-16',
    medium: 'h-24',
    large: 'h-32'
  }

  const positionStyles = {
    top: 'fixed top-0 left-0 right-0 z-40',
    bottom: 'fixed bottom-0 left-0 right-0 z-40',
    sidebar: 'sticky top-4'
  }

  return (
    <div
      className={cn(
        'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'flex items-center justify-center',
        'transition-all duration-300',
        sizeStyles[size],
        positionStyles[position],
        className
      )}
      role="banner"
      aria-label="광고"
    >
      {/* 임시 광고 콘텐츠 (실제로는 Google AdSense 등으로 대체) */}
      <div className="text-center p-4">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
          광고
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          교실 코드 입력 시 광고가 숨겨집니다
        </div>
      </div>
      
      {/* 실제 광고 스크립트가 들어갈 위치 */}
      {process.env.NODE_ENV === 'production' && (
        <div 
          id={`ad-banner-${position}-${size}`}
          className="w-full h-full"
          data-ad-position={position}
          data-ad-size={size}
        />
      )}
    </div>
  )
}

/**
 * 사이드바 광고 컴포넌트
 */
export function SidebarAd({ className }: { className?: string }) {
  return (
    <AdBanner 
      position="sidebar" 
      size="large"
      className={cn('w-full max-w-xs', className)}
    />
  )
}

/**
 * 상단 배너 광고 컴포넌트
 */
export function TopBanner({ className }: { className?: string }) {
  return (
    <AdBanner 
      position="top" 
      size="small"
      className={className}
    />
  )
}

/**
 * 하단 배너 광고 컴포넌트
 */
export function BottomBanner({ className }: { className?: string }) {
  return (
    <AdBanner 
      position="bottom" 
      size="medium"
      className={className}
    />
  )
}

/**
 * 콘텐츠 사이 광고 컴포넌트
 */
export function InlineAd({ className }: { className?: string }) {
  const { shouldShowAds } = useAdsVisibility()

  if (!shouldShowAds) {
    return null
  }

  return (
    <div
      className={cn(
        'w-full py-8 my-8',
        'bg-gray-50 dark:bg-gray-900',
        'border-y border-gray-200 dark:border-gray-700',
        'flex items-center justify-center',
        className
      )}
      role="banner"
      aria-label="광고"
    >
      <div className="text-center">
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          광고
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-500">
          교실 참여 시 광고가 숨겨집니다
        </div>
      </div>
    </div>
  )
}
