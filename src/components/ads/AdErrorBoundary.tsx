"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AdErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface AdErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error }>;
  className?: string;
}

/**
 * 광고 컴포넌트 전용 Error Boundary
 * - 광고 로딩 실패 시 사용자 화면을 보호
 * - 폴백 UI 제공
 */
export class AdErrorBoundary extends React.Component<
  AdErrorBoundaryProps,
  AdErrorBoundaryState
> {
  constructor(props: AdErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): AdErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("AdErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 폴백이 있으면 사용
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} />;
      }

      // 기본 폴백 UI
      return (
        <div
          className={cn(
            "bg-gray-50 dark:bg-gray-900",
            "border border-gray-200 dark:border-gray-700",
            "rounded-lg p-4 text-center",
            "text-sm text-gray-500 dark:text-gray-400",
            this.props.className
          )}
          role="banner"
          aria-label="광고 로드 실패"
        >
          <div className="mb-2">
            <svg
              className="mx-auto h-8 w-8 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div className="text-xs">광고를 불러올 수 없습니다</div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 기본 광고 폴백 컴포넌트
 */
export function DefaultAdFallback({ error }: { error?: Error }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center">
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">광고</div>
      <div className="text-xs text-gray-400 dark:text-gray-500">
        일시적으로 표시할 수 없습니다
      </div>
    </div>
  );
}
