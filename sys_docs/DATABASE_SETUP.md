# Word Rush Database Setup Guide

## 개요

Word Rush 프로젝트의 데이터베이스 스키마 설정 및 샘플 데이터 로드 가이드입니다.

## 데이터베이스 스키마

### 테이블 구조

#### 1. organizations (orgs)

조직(학교, 학원, 스터디 그룹) 정보를 저장합니다.

- `id`: UUID (Primary Key)
- `name`: 조직명
- `code`: 고유 코드 (UNIQUE)
- `type`: 조직 유형 (school, academy, study_group, company)
- `description`: 설명
- `settings`: JSON 설정
- `is_active`: 활성 상태
- `created_at`, `updated_at`: 생성/수정 시간

#### 2. users

사용자 정보를 저장합니다.

- `id`: UUID (Primary Key)
- `auth_id`: Supabase Auth와 연결되는 ID
- `email`: 이메일 (UNIQUE)
- `username`: 사용자명 (UNIQUE)
- `display_name`: 표시명
- `avatar_url`: 프로필 이미지 URL
- `role`: 사용자 역할 (student, teacher, admin)
- `org_id`: 소속 조직 ID (FK)
- `grade_level`: 학년 (1-12)
- `settings`: JSON 설정
- `stats`: JSON 통계 정보
- `is_active`: 활성 상태
- `created_at`, `updated_at`: 생성/수정 시간

#### 3. word_items

단어 정보를 저장합니다.

- `id`: UUID (Primary Key)
- `word`: 영어 단어
- `meaning`: 한글 뜻
- `difficulty`: 난이도 (easy, medium, hard)
- `category`: 카테고리
- `tags`: 태그 배열
- `example_sentence`: 예문
- `created_by`: 생성자 ID (FK)
- `is_approved`: 승인 상태
- `usage_count`: 사용 횟수
- `created_at`, `updated_at`: 생성/수정 시간

#### 4. rounds

라운드 정보를 저장합니다.

- `id`: UUID (Primary Key)
- `user_id`: 사용자 ID (FK)
- `org_id`: 조직 ID (FK)
- `duration_sec`: 라운드 시간 (60, 75, 90초)
- `status`: 라운드 상태 (active, completed, abandoned)
- `start_time`, `end_time`: 시작/종료 시간
- `total_questions`: 총 문제 수
- `correct_answers`: 정답 수
- `total_score`: 총 점수
- `avg_response_time_ms`: 평균 응답 시간
- `settings`: JSON 설정
- `created_at`, `updated_at`: 생성/수정 시간

#### 5. round_items

라운드 내 개별 문제 정보를 저장합니다.

- `id`: UUID (Primary Key)
- `round_id`: 라운드 ID (FK)
- `word_item_id`: 단어 ID (FK)
- `question_order`: 문제 순서
- `user_answer`: 사용자 답변
- `is_correct`: 정답 여부
- `response_time_ms`: 응답 시간 (0-30000ms)
- `score`: 점수
- `created_at`: 생성 시간

#### 6. leaderboards

리더보드 정보를 저장합니다.

- `id`: UUID (Primary Key)
- `user_id`: 사용자 ID (FK, 상호배타)
- `org_id`: 조직 ID (FK, 상호배타)
- `period`: 기간 (daily, weekly, monthly, all_time)
- `scope`: 범위 (global, school, class, friends)
- `subject`: 과목 (vocabulary, grammar, reading, mixed)
- `total_score`: 총 점수
- `total_rounds`: 총 라운드 수
- `best_score`: 최고 점수
- `avg_score`: 평균 점수
- `rank_position`: 순위
- `percentile`: 백분위
- `last_updated`: 마지막 업데이트
- `created_at`, `updated_at`: 생성/수정 시간

### ENUM 타입

- `leaderboard_period`: daily, weekly, monthly, all_time
- `leaderboard_scope`: global, school, class, friends
- `leaderboard_subject`: vocabulary, grammar, reading, mixed
- `round_duration`: 60, 75, 90
- `round_status`: active, completed, abandoned
- `word_difficulty`: easy, medium, hard
- `user_role`: student, teacher, admin
- `org_type`: school, academy, study_group, company

### 뷰 (Views)

#### top_users

사용자 리더보드 뷰

#### top_organizations

조직 리더보드 뷰

## RLS (Row Level Security) 정책

### 공개 읽기 테이블

- `orgs`: 모든 사용자가 조회 가능
- `word_items`: 모든 사용자가 조회 가능
- `leaderboards`: 모든 사용자가 조회 가능

### 사용자별 접근 제한 테이블

- `users`: 본인 데이터만 읽기/쓰기, 교사는 소속 조직 학생 조회 가능
- `rounds`: 본인 라운드만 읽기/쓰기, 교사는 소속 조직 라운드 조회 가능
- `round_items`: 본인 라운드 아이템만 읽기/쓰기, 교사는 소속 조직 조회 가능

## 트리거 및 함수

### 자동 업데이트 트리거

- `update_updated_at_column()`: updated_at 컬럼 자동 업데이트
- `update_round_stats()`: round_items 변경 시 rounds 통계 자동 업데이트
- `update_leaderboard_rankings()`: 리더보드 순위 및 백분위 자동 계산
- `handle_new_user()`: Auth 사용자 생성 시 users 테이블에 자동 등록
- `update_user_stats_from_rounds()`: 라운드 완료 시 사용자 통계 및 리더보드 업데이트

## 샘플 데이터

### 조직 (3개)

- 서울고등학교 (SEOUL001)
- 영어학원 ABC (ABC001)
- 스터디그룹 베타 (BETA001)

### 단어 (10개)

기초~고급 난이도의 영어 단어 10개가 포함되어 있습니다:

- apple, beautiful, computer, determine, education
- freedom, government, happiness, important, journey

## 마이그레이션 파일

1. `20250119000001_bootstrap.sql`: 기본 확장 및 ENUM 타입 생성
2. `20250119000002_core_tables.sql`: 코어 테이블 (orgs, users, word_items) 생성
3. `20250119000003_round_tables.sql`: 라운드 관련 테이블 생성
4. `20250119000004_leaderboard_tables.sql`: 리더보드 테이블 및 뷰 생성
5. `20250119000005_rls_policies.sql`: RLS 정책 적용

## 시드 데이터 적용

### 초기 적용

```bash
supabase db push --include-seed
```

### 재적용 (기존 데이터 유지)

샘플 데이터는 `ON CONFLICT` 구문을 사용하여 중복 방지됩니다.

## 데이터베이스 연결 확인

### 환경 변수 설정

`.env.local` 파일에 다음 변수들이 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 연결 테스트

프론트엔드에서 다음과 같이 테스트할 수 있습니다:

```typescript
import { supabase } from "@/lib/supabase";

// 공개 테이블 조회 테스트
const { data: orgs } = await supabase.from("orgs").select("*");
const { data: words } = await supabase.from("word_items").select("*");
```
