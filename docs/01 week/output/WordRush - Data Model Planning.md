# Data Model Planning Worksheet

## **소개**

- 개발에 앞서 애플리케이션의 **데이터 구조를 최대한 체계적으로 정의**하는 것이 이 과제의 목표입니다.
- 엔터티, 필드, 관계, 권한, 비즈니스 규칙 등을 사전에 정리하는 작업은 **데이터 모델링의 오류나 누락을 줄이고**, 이후 개발의 방향성을 명확히 하는 데 큰 도움이 됩니다.
- **어떤 엔터티(데이터 객체)** 들이 존재하며, **서로 어떤 관계와 규칙**을 가지고 있는지를 중심으로 워크시트를 작성해보세요.
- 작성이 어렵다면, 함께 제공되는 예시를 참고하셔도 좋습니다.

## 1. 시스템의 핵심 엔터티(Entities)는 무엇인가요? (3~5개)

_애플리케이션에서 관리할 핵심 객체(주로 데이터베이스 테이블이 될 대상)를 3~5개 나열하세요._

- **users** (사용자) - 게임 플레이어, 교사, 학생 정보 관리
- **rounds** (라운드) - 60~90초 게임 세션 정보 및 결과
- **word_items** (단어 문항) - 영어 단어 퀴즈 문제 데이터
- **leaderboards** (리더보드) - 주간/월간 순위 및 점수 기록
- **orgs** (조직) - 학교, 학원, 스터디 그룹 정보

---

## 2. 각 엔터티의 필드를 정의하세요:

_각 엔터티에 대해 주요 속성과 데이터 타입, 필요한 제약 조건 등을 정의하세요._

**[Entity 1: users]**

- `id` (UUID PRIMARY KEY) - 사용자 고유 식별자
- `nickname` (VARCHAR(20) UNIQUE NOT NULL) - 닉네임 (중복 불가)
- `age_band` (VARCHAR(10) NOT NULL) - 연령대 ('유치', '초저', '초중', '초고', '중', '고')
- `org_code` (VARCHAR(10) REFERENCES orgs(org_code)) - 소속 조직 코드
- `email` (VARCHAR(255) UNIQUE) - 이메일 (회원가입 시)
- `created_at` (TIMESTAMP DEFAULT NOW()) - 계정 생성 시간
- `last_login_at` (TIMESTAMP) - 마지막 로그인 시간
- `total_rounds` (INTEGER DEFAULT 0) - 총 라운드 수
- `total_score` (BIGINT DEFAULT 0) - 총 점수
- `current_streak` (INTEGER DEFAULT 0) - 현재 연속 출석 일수

**[Entity 2: rounds]**

- `id` (UUID PRIMARY KEY) - 라운드 고유 식별자
- `user_id` (UUID REFERENCES users(id) NOT NULL) - 플레이어 ID
- `started_at` (TIMESTAMP NOT NULL) - 라운드 시작 시간
- `ended_at` (TIMESTAMP) - 라운드 종료 시간
- `score` (INTEGER NOT NULL) - 최종 점수
- `accuracy` (DECIMAL(5,2) NOT NULL) - 정확도 (%)
- `avg_response_time` (INTEGER NOT NULL) - 평균 응답시간 (ms)
- `max_combo` (INTEGER DEFAULT 0) - 최대 콤보 수
- `difficulty_profile` (JSON) - 난이도 분포 정보
- `is_valid` (BOOLEAN DEFAULT true) - 유효한 라운드 여부
- `created_at` (TIMESTAMP DEFAULT NOW()) - 생성 시간

**[Entity 3: word_items]**

- `id` (UUID PRIMARY KEY) - 문항 고유 식별자
- `headword` (VARCHAR(100) NOT NULL) - 영어 단어
- `pos` (VARCHAR(20)) - 품사 (noun, verb, adjective 등)
- `sense_key` (VARCHAR(50)) - 의미 키
- `ko_gloss` (TEXT NOT NULL) - 한국어 뜻
- `difficulty_beta` (DECIMAL(3,2) NOT NULL) - 난이도 계수 (0.1~2.0)
- `tags` (JSON) - 태그 (주제, 오답 유형 등)
- `question_type` (VARCHAR(20) NOT NULL) - 문제 타입 (T1, T2, T3, T4, T5)
- `options` (JSON) - 객관식 보기 (T1, T2, T4, T5용)
- `created_at` (TIMESTAMP DEFAULT NOW()) - 생성 시간

**[Entity 4: leaderboards]**

- `id` (UUID PRIMARY KEY) - 리더보드 기록 고유 식별자
- `user_id` (UUID REFERENCES users(id) NOT NULL) - 사용자 ID
- `week_id` (VARCHAR(10) NOT NULL) - 주차 식별자 ('2024-W01' 형식)
- `weighted_score` (INTEGER NOT NULL) - 가중 점수 (난이도 보정)
- `rank` (INTEGER NOT NULL) - 순위
- `board_type` (VARCHAR(20) NOT NULL) - 보드 타입 ('global', 'school', 'group')
- `org_code` (VARCHAR(10) REFERENCES orgs(org_code)) - 조직 코드
- `valid_rounds_count` (INTEGER DEFAULT 0) - 유효 라운드 수
- `created_at` (TIMESTAMP DEFAULT NOW()) - 생성 시간
- `UNIQUE(user_id, week_id, board_type)` - 복합 유니크 제약

**[Entity 5: orgs]**

- `org_code` (VARCHAR(10) PRIMARY KEY) - 조직 고유 코드
- `name` (VARCHAR(100) NOT NULL) - 조직명
- `type` (VARCHAR(20) NOT NULL) - 조직 타입 ('school', 'academy', 'study_group')
- `created_at` (TIMESTAMP DEFAULT NOW()) - 생성 시간
- `created_by` (UUID REFERENCES users(id)) - 생성자 (교사/관리자)

---

## 3. 어떤 관계들이 존재하나요?

_각 엔터티 간의 관계를 정의하세요 (예: 일대다, 다대다 등). 가능하다면 ERD(엔터티 관계도)를 그려보세요._

- **users ↔ orgs**: 다대일 (Many-to-One)

  - 한 조직에 여러 사용자가 소속될 수 있음
  - 사용자는 하나의 조직에만 소속 가능 (선택사항)

- **users ↔ rounds**: 일대다 (One-to-Many)

  - 한 사용자가 여러 라운드를 플레이할 수 있음
  - 각 라운드는 하나의 사용자에만 속함

- **rounds ↔ round_items**: 일대다 (One-to-Many)

  - 한 라운드에 여러 문항이 포함됨
  - 각 round_item은 하나의 라운드에만 속함

- **word_items ↔ round_items**: 일대다 (One-to-Many)

  - 한 문항이 여러 라운드에서 사용될 수 있음
  - 각 round_item은 하나의 문항을 참조함

- **users ↔ leaderboards**: 일대다 (One-to-Many)

  - 한 사용자가 여러 리더보드 기록을 가질 수 있음
  - 각 리더보드 기록은 하나의 사용자에만 속함

- **orgs ↔ leaderboards**: 일대다 (One-to-Many)
  - 한 조직에 여러 리더보드 기록이 있을 수 있음
  - 각 리더보드 기록은 하나의 조직에만 속함 (조직별 리더보드)

---

## 4. 어떤 CRUD 작업이 필요한가요?

_각 엔터티에 대해 Create, Read, Update, Delete 중 어떤 작업이 필요한지, 그리고 누가 수행할 수 있는지를 정의하세요._

| Entity       | Create                | Read                          | Update              | Delete               |
| ------------ | --------------------- | ----------------------------- | ------------------- | -------------------- |
| users        | 회원가입 시 (자동)    | 본인, 교사(소속 학생), 관리자 | 본인, 관리자        | 본인, 관리자         |
| rounds       | 게임 시작 시 (자동)   | 본인, 교사(소속 학생), 관리자 | 게임 종료 시 (자동) | 부정행위 시 (관리자) |
| word_items   | 관리자만              | 모든 사용자 (게임에서)        | 관리자만            | 관리자만             |
| leaderboards | 라운드 완료 시 (자동) | 모든 사용자                   | 주간 집계 시 (자동) | 기간 만료 시 (자동)  |
| orgs         | 교사/관리자           | 모든 사용자                   | 교사/관리자         | 관리자만             |

---

## 5. 어떤 규칙이나 제약이 존재하나요?

_비즈니스 규칙, 입력값 유효성 검증, 데이터 무결성 제약 조건 등을 작성하세요._

### 비즈니스 규칙

- **라운드 제한**: 사용자는 한 번에 하나의 라운드만 진행 가능
- **시간 제한**: 라운드는 60~90초로 제한 (설정 가능)
- **점수 계산**: 점수 = Base(100) × DifficultyCoeff × SpeedCoeff × ComboCoeff
- **콤보 시스템**: 5/10/15 연속 정답 시 1.05/1.10/1.15 배수 적용
- **일일 제한**: 상위 5회 라운드만 주간 랭킹에 반영

### 데이터 무결성 제약

- **사용자 닉네임**: 중복 불가, 2~20자 제한
- **연령대**: '유치', '초저', '초중', '초고', '중', '고' 중 하나만 허용
- **난이도 계수**: 0.1~2.0 범위 내 값만 허용
- **정확도**: 0.0~100.0 범위
- **응답시간**: 최소 200ms 이상 (부정행위 방지)

### 보안 및 권한 규칙

- **RLS (Row-Level Security)**: 사용자는 자신의 데이터만 접근 가능
- **교사 권한**: 소속 학생의 데이터만 조회 가능
- **관리자 권한**: 모든 데이터 접근 및 관리 가능
- **게스트 사용자**: 제한된 기능만 사용 가능

### 부정행위 방지 규칙

- **응답시간 검증**: 200ms 미만 응답은 의심스러운 패턴으로 분류
- **패턴 분석**: 비정상적으로 높은 정확도와 빠른 응답시간 조합 감지
- **라운드 무효화**: 부정행위 감지 시 해당 라운드 자동 무효화
- **계정 제재**: 반복적인 부정행위 시 계정 일시 정지

### 데이터 보존 정책

- **리더보드**: 주간 단위로 집계, 월간 단위로 아카이브
- **라운드 데이터**: 1년간 보존 후 자동 삭제
- **사용자 데이터**: 계정 삭제 시 관련 데이터 모두 삭제
- **오답노트**: 사용자가 직접 삭제하거나 완전히 익힌 후 자동 삭제
