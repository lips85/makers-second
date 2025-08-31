# 광고 설정 가이드

## 개요

이 문서는 WordRush 프로젝트의 광고 시스템 설정 방법을 설명합니다.

## 환경 변수 설정

### 필수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
# Google AdSense/AdMob 클라이언트 ID
NEXT_PUBLIC_GADS_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX

# 광고 강제 비활성화 (개발/테스트용)
NEXT_PUBLIC_FORCE_ADS_DISABLED=false
```

### 개발 환경 설정

개발 환경에서는 기본적으로 광고가 비활성화됩니다:

```bash
# 개발 환경에서 광고 비활성화
NEXT_PUBLIC_FORCE_ADS_DISABLED=true
```

## Google AdSense 설정

### 1. AdSense 계정 생성

1. [Google AdSense](https://www.google.com/adsense)에 접속
2. 계정 생성 및 사이트 등록
3. 승인 후 클라이언트 ID 발급

### 2. 광고 단위 생성

1. AdSense 대시보드에서 "광고" → "광고 단위" 선택
2. 새로운 광고 단위 생성:
   - **이름**: `WordRush-Bottom-Banner`
   - **크기**: `728x90` (데스크톱) 또는 `320x50` (모바일)
   - **타입**: 배너 광고

### 3. 광고 코드 적용

생성된 광고 단위 ID를 환경 변수에 설정:

```bash
NEXT_PUBLIC_GADS_CLIENT_ID=ca-pub-XXXXXXXXXXXXXXXX
```

## 광고 표시 로직

### 광고 숨김 조건

다음 조건에서 광고가 자동으로 숨겨집니다:

1. **교실 세션 활성화**: 교실 코드 입력 시
2. **URL 파라미터**: `?org=` 또는 `?classroom=` 파라미터 존재 시
3. **강제 비활성**: `NEXT_PUBLIC_FORCE_ADS_DISABLED=true` 설정 시

### 광고 위치

- **결과 화면 하단**: 게임 결과 모달 하단
- **리더보드 사이드바**: 데스크톱 리더보드 페이지 (향후 구현)
- **인라인 광고**: 콘텐츠 사이 (향후 구현)

## 성능 최적화

### FCP 우선 보장

광고 로드는 First Contentful Paint (FCP) 이후에 시작됩니다:

```typescript
// 성능 메트릭 수집
import {
  collectAdsMetrics,
  sendAdsMetrics,
} from "@/lib/ads/performance-metrics";

const metrics = collectAdsMetrics();
sendAdsMetrics(metrics);
```

### 비동기 로딩

광고 스크립트는 비동기적으로 로드되어 페이지 성능에 영향을 최소화합니다:

```typescript
// 광고 스크립트 로드
import { loadGoogleAdsScript } from "@/lib/ads/google-ads-loader";

const success = await loadGoogleAdsScript();
```

## 에러 처리

### Error Boundary

광고 로드 실패 시 Error Boundary가 사용자 화면을 보호합니다:

```typescript
import { AdErrorBoundary } from "@/components/ads/AdErrorBoundary";

<AdErrorBoundary fallback={CustomFallback}>
  <AdBanner />
</AdErrorBoundary>;
```

### 폴백 UI

광고 로드 실패 시 기본 폴백 UI가 표시됩니다:

```typescript
import { DefaultAdFallback } from "@/components/ads/AdErrorBoundary";

<DefaultAdFallback />;
```

## 테스트

### E2E 테스트 실행

```bash
npm run test:e2e -- ads-visibility.spec.ts
```

### 단위 테스트 실행

```bash
npm test -- AdErrorBoundary.test.tsx
```

## 운영 체크리스트

### 배포 전 확인사항

- [ ] `NEXT_PUBLIC_GADS_CLIENT_ID` 설정 완료
- [ ] `NEXT_PUBLIC_FORCE_ADS_DISABLED=false` (프로덕션)
- [ ] E2E 테스트 통과
- [ ] 단위 테스트 통과
- [ ] 성능 테스트 완료

### 모니터링

- 광고 로드 성공률
- FCP 이후 광고 로드 비율
- 에러 발생률
- 수익 지표 (AdSense 대시보드)

## 문제 해결

### 일반적인 문제

1. **광고가 표시되지 않음**

   - 환경 변수 설정 확인
   - AdSense 계정 승인 상태 확인
   - 교실 세션 상태 확인

2. **광고 로드 에러**

   - 네트워크 연결 확인
   - AdSense 정책 준수 확인
   - 브라우저 콘솔 에러 확인

3. **성능 문제**
   - FCP 측정 확인
   - 광고 스크립트 로드 시간 확인
   - 성능 메트릭 분석

### 지원

문제가 발생하면 다음을 확인하세요:

1. 브라우저 개발자 도구 콘솔
2. 네트워크 탭에서 광고 요청 상태
3. 성능 탭에서 로딩 시간
4. AdSense 대시보드에서 정책 위반 여부
