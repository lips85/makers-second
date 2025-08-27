# Word Rush - 영어 단어 스피드 퀴즈

Word Rush는 사용자가 재미있는 게임을 통해 영어 단어 실력을 향상시킬 수 있도록 설계된 웹 애플리케이션입니다. 빠른 속도로 단어 퀴즈를 풀고, 친구 및 다른 사용자들과 리더보드에서 경쟁하며 학습 동기를 얻을 수 있습니다.

## ✨ 주요 기능 (Features)

- **🚀 스피드 퀴즈 게임**: 제한 시간 내에 최대한 많은 단어 퀴즈를 풀어 점수를 획득합니다. 점수는 정확도와 속도를 기반으로 계산됩니다.
- **🏆 실시간 리더보드**: 일간, 주간, 월간 리더보드를 통해 자신의 순위를 확인하고 다른 사용자들과 실력을 겨룰 수 있습니다.
- **📊 개인 성과 분석**: 개인의 성과를 백분위(Percentile) 및 스타나인(Stanine) 점수로 시각화하여 학습 성과를 직관적으로 파악할 수 있습니다.
- **🧑‍🏫 교실 및 학생 관리**: 교사는 '교실 코드'를 생성하여 학생들을 관리하고, 학생들의 학습 진행 상황을 모니터링할 수 있습니다.
- ** guest 모드**: 회원가입 없이 즉시 게임을 체험해볼 수 있으며, 원할 때 언제든지 정식 계정으로 전환할 수 있습니다.

## 🛠️ 기술 스택 (Tech Stack)

- **프레임워크**: Next.js
- **언어**: TypeScript
- **스타일링**: Tailwind CSS, shadcn/ui
- **상태 관리**: TanStack React Query
- **백엔드 & 데이터베이스**: Supabase (PostgreSQL, Auth, Storage)
- **ORM**: Drizzle ORM
- **테스팅**: Jest (Unit/Integration), Playwright (E2E)
- **CI/CD**: GitHub Actions
- **배포**: Vercel, Netlify

## 🚀 시작하기 (Getting Started)

### 1. 저장소 복제

```bash
git clone https://github.com/your-repo/word-rush.git
cd word-rush
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. 환경 변수 설정

`.env.local.example` 파일을 복사하여 `.env.local` 파일을 생성하고, Supabase 프로젝트의 환경 변수를 입력합니다.

```bash
cp .env.local.example .env.local
```

```.env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"

# Google Ads (Optional)
NEXT_PUBLIC_GOOGLE_ADS_CLIENT_ID="YOUR_GOOGLE_ADS_CLIENT_ID"
```

### 4. 데이터베이스 마이그레이션 및 시딩

Supabase 데이터베이스에 스키마를 적용하고 초기 데이터를 시딩합니다.

```bash
pnpm db:all
```

### 5. 개발 서버 실행

```bash
pnpm dev
```

이제 `http://localhost:3000`에서 애플리케이션을 확인할 수 있습니다.

## 📜 주요 스크립트 (Available Scripts)

- `pnpm dev`: 개발 서버를 시작합니다.
- `pnpm build`: 프로덕션용으로 애플리케이션을 빌드합니다.
- `pnpm start`: 빌드된 애플리케이션을 실행합니다.
- `pnpm lint`: 코드 스타일을 검사하고 수정합니다.
- `pnpm test`: 모든 Jest 테스트를 실행합니다.
- `pnpm test:e2e`: Playwright E2E 테스트를 실행합니다.
- `pnpm db:migrate`: 데이터베이스 마이그레이션을 적용합니다.
- `pnpm db:seed`: 데이터베이스에 초기 데이터를 시딩합니다.
- `pnpm db:generate`: Drizzle 스키마를 기반으로 마이그레이션 파일을 생성합니다.

## 🗂️ 프로젝트 구조 (Project Structure)

```
.
├── src/
│   ├── app/         # Next.js App Router: 페이지 및 API 라우트
│   ├── components/  # 재사용 가능한 React 컴포넌트
│   ├── db/          # Drizzle 스키마, 마이그레이션, RLS 정책
│   ├── lib/         # 핵심 유틸리티 및 비즈니스 로직
│   └── hooks/       # 커스텀 React Hooks
├── supabase/        # Supabase 마이그레이션 SQL 파일
├── scripts/         # 데이터베이스 시딩 및 정책 적용 스크립트
├── e2e/             # Playwright E2E 테스트
└── public/          # 정적 에셋
```

## ✅ 개선을 위한 할 일 목록 (TODO List)

다음은 프로젝트의 안정성과 확장성을 개선하기 위한 작업 목록입니다.

- **[긴급] 게스트 사용자 업그레이드 로직 수정**:
  - **문제점**: 현재 `upgrade_guest_to_user` SQL 함수는 동시에 여러 게스트가 존재할 경우, 모든 게스트 데이터를 한 명의 신규 사용자에게 병합시키는 심각한 버그가 있습니다.
  - **해결책**: 함수가 `guest_id`를 인자로 받아 특정 게스트만 정확하게 업그레이드하도록 수정해야 합니다.

- **멱등성 처리 개선**:
  - **문제점**: `submitRound` API의 멱등성 제어가 서버 인스턴스 간에 공유되지 않는 인메모리 `Set`으로 구현되어 있습니다.
  - **해결책**: 서버가 수평적으로 확장될 경우를 대비해 Redis, Memcached 또는 데이터베이스 기반의 분산 잠금 메커니즘으로 교체해야 합니다.

- **비활성 게스트 계정 정리**:
  - **문제점**: 게스트 계정이 계속해서 쌓이면 데이터베이스 성능에 영향을 줄 수 있습니다.
  - **해결책**: 일정 기간 이상 활동이 없는 게스트 계정을 주기적으로 삭제하는 Cron Job을 Supabase 또는 외부 스케줄러를 이용해 구현해야 합니다.

- **테스트 커버리지 확대**:
  - **문제점**: `submitRound` 외 핵심 API 라우트(예: `generateCode`, `joinCode`, `auth/*`)에 대한 테스트가 부족합니다.
  - **해결책**: 중요한 API와 비즈니스 로직에 대한 통합 및 단위 테스트를 추가하여 코드 안정성을 높여야 합니다.

- **CORS 정책 강화**:
  - **문제점**: API의 CORS 정책이 모든 출처(`*`)를 허용하고 있어 보안에 취약합니다.
  - **해결책**: 프로덕션 환경에서는 허용된 프론트엔드 도메인만 명시적으로 지정하도록 변경해야 합니다.

- **API 속도 제한 적용 (Rate Limiting)**:
  - **문제점**: 인증 및 코드 생성 관련 API가 무차별 대입 공격(Brute-force)에 노출될 수 있습니다.
  - **해결책**: Vercel의 방화벽 기능이나 `upstash/ratelimit`과 같은 라이브러리를 사용하여 API에 속도 제한을 적용해야 합니다.

- **오류 로깅 및 모니터링 시스템 도입**:
  - **문제점**: 프로덕션 환경에서 발생하는 오류를 추적하고 분석하기 어렵습니다.
  - **해결책**: Sentry, Datadog과 같은 외부 로깅 서비스를 연동하여 서버 측 오류를 체계적으로 관리해야 합니다.
