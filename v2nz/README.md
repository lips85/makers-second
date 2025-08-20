# V2NZ - 영어 단어 스피드 퀴즈

60~90초 라운드 동안 텍스트 기반 단어 문제를 풀고 **정확도 × 속도**로 점수를 산출, **리더보드·퍼센타일**로 동기를 부여하는 학습 게임입니다.

## 🎯 프로젝트 개요

- **주 사용자**: 국내 K-12 학생(8~18세)
- **사용 시나리오**: 수업 전·후 3~5분 '워밍업 게임'
- **수익 모델**: 무료 + 배너 광고 (교실 코드 입력 시 광고 숨김)

## 🚀 기술 스택

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, lucide-react
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **State Management**: @tanstack/react-query
- **Utilities**: date-fns
- **배포**: Vercel

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 데이터베이스 설정 (Drizzle ORM)

#### 환경변수 추가
`.env.local`에 다음 변수들을 추가하세요:

```env
# Database Connection
SUPABASE_DB_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?sslmode=require

# Environment
NODE_ENV=development
SEED_ENABLED=true

# Database Connection Pool (optional)
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
```

#### 데이터베이스 마이그레이션 및 시드
```bash
# 전체 데이터베이스 설정 (마이그레이션 + 시드)
npm run db:all

# 개별 명령어
npm run db:generate    # 스키마에서 마이그레이션 생성
npm run db:migrate     # 마이그레이션 적용 + RLS 정책 적용
npm run db:seed        # 개발용 샘플 데이터 삽입
npm run db:check       # 스키마/정책/데이터 검증
npm run db:reset       # 마이그레이션 초기화 및 재생성
```

#### 워크플로 및 주의사항
- **개발 환경**: `npm run db:all`로 한 번에 마이그레이션과 시드 실행
- **멱등성**: 모든 명령어는 반복 실행해도 안전함
- **RLS 정책**: 마이그레이션 후 자동으로 적용됨
- **시드 데이터**: 개발 환경에서만 실행되며, 운영 환경에서는 차단됨
- **검증**: `npm run db:check`로 스키마, 정책, 샘플 쿼리 검증
- **CI/CD**: 필요시 GitHub Actions 워크플로 추가 가능

### 4. 개발 서버 실행
```bash
npm run dev
```

### 5. 빌드 및 배포
```bash
npm run build
npm start
```

## 🔄 코드 수정 시 설정 가이드

### 데이터베이스 스키마 수정 시
스키마 파일(`src/db/schema/*.ts`)을 수정한 후:

```bash
# 1. 마이그레이션 생성
npm run db:generate

# 2. 마이그레이션 적용 (RLS 정책도 함께 적용)
npm run db:migrate

# 3. 시드 데이터 재삽입 (필요시)
npm run db:seed

# 4. 검증
npm run db:check
```

### 환경변수 추가/수정 시
1. `.env.local`에 새 환경변수 추가
2. `src/lib/env.ts`의 `envSchema`에 새 변수 정의
3. 개발 서버 재시작: `npm run dev`

### 새로운 패키지 설치 시
```bash
# 런타임 의존성
npm install package-name

# 개발 의존성
npm install -D package-name

# 설치 후 타입 체크
npm run type-check
```

### Supabase 설정 변경 시
1. Supabase 대시보드에서 설정 변경
2. 필요한 경우 RLS 정책 수정: `src/db/policies/*.sql`
3. 정책 재적용: `npm run db:migrate`

### 개발 서버 문제 해결
```bash
# 캐시 클리어
rm -rf .next
npm run dev

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 타입 체크
npm run type-check
```

## 🏗️ 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
│   ├── layout.tsx      # 루트 레이아웃
│   ├── page.tsx        # 메인 페이지
│   └── globals.css     # 전역 스타일
├── components/         # React 컴포넌트
│   └── ui/            # shadcn/ui 컴포넌트
├── db/                 # 데이터베이스 관련
│   ├── client.ts       # Drizzle 클라이언트
│   ├── schema/         # Drizzle 스키마
│   │   ├── index.ts    # 스키마 통합
│   │   ├── orgs.ts     # 조직 테이블
│   │   ├── users.ts    # 사용자 테이블
│   │   ├── word-items.ts # 단어 테이블
│   │   ├── rounds.ts   # 라운드 테이블
│   │   ├── round-items.ts # 라운드 아이템 테이블
│   │   └── leaderboards.ts # 리더보드 테이블
│   ├── migrations/     # 마이그레이션 파일
│   ├── policies/       # RLS 정책 SQL
│   └── verify.ts       # 검증 스크립트
├── lib/               # 유틸리티 및 설정
│   ├── env.ts         # 환경변수 검증
│   ├── supabase.ts    # Supabase 클라이언트
│   ├── providers.tsx  # React Query Provider
│   └── utils.ts       # 유틸리티 함수
├── scripts/           # 데이터베이스 스크립트
│   ├── apply-policies.ts # RLS 정책 적용
│   └── seed.ts        # 시드 데이터
└── types/             # TypeScript 타입 정의
```

## 🎮 주요 기능

### MVP 기능 (8주 로드맵)
- [x] 프로젝트 환경 셋업
- [ ] 핵심 라운드 플레이 + 기본 리더보드 + 광고 SDK
- [ ] 학교/집단 코드 & 대항전 초기 버전
- [ ] 데일리 챌린지, 출석 보상
- [ ] 단어장/오답 노트, 리더보드 개선(퍼센타일)
- [ ] 공유 카드, 교사용 보드, 주간 리포트

## 📊 성공 지표 (KPI)

- D1/D7 Retention ≥ 40% / 20%
- 평균 세션당 라운드 수 ≥ 2.0
- 주당 유효 라운드(≥8) 참여율 ≥ 60%
- 리더보드 조회율 ≥ 70%
- 광고 eCPM ≥ $3

## 🔧 개발 가이드

### 코드 스타일
- TypeScript strict 모드 사용
- ESLint + Prettier 설정
- shadcn/ui 컴포넌트 활용
- TailwindCSS 클래스 우선 사용

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

### 데이터베이스 작업 시 주의사항
- **스키마 변경**: 항상 `npm run db:generate` 후 `npm run db:migrate` 실행
- **정책 변경**: RLS 정책 수정 후 `npm run db:migrate`로 재적용
- **시드 데이터**: 개발 환경에서만 실행, 운영 환경에서는 차단됨
- **검증**: 변경사항 적용 후 `npm run db:check`로 검증

### 환경별 설정
- **개발 환경**: `NODE_ENV=development`, `SEED_ENABLED=true`
- **테스트 환경**: `NODE_ENV=test`, `SEED_ENABLED=true` (CI에서 사용)
- **운영 환경**: `NODE_ENV=production`, 시드 자동 차단

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
