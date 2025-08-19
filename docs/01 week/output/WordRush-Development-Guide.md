# WordRush 개발 가이드
**작성일:** 2024년 12월  
**버전:** v1.0  
**상태:** 개발 준비

---

## 1. 프로젝트 개요

### 1.1 서비스 개요
- **서비스명**: WordRush (워드러시)
- **목적**: 게임화를 통한 영어 단어 학습 플랫폼
- **핵심 기능**: 60~90초 스피드 퀴즈, 리더보드, 오답노트, 퍼센타일 등급

### 1.2 핵심 요구사항
- **성능**: 실시간 게임 플레이, 빠른 응답 속도
- **확장성**: 다수 사용자 동시 접속 지원
- **접근성**: 모바일 친화적, 접근성 고려
- **보안**: 학생 개인정보 보호, 부정행위 방지

---

## 2. 기술 스택 선정

### 2.1 프론트엔드
**Next.js 14** (선택 근거)
- ✅ 빠른 개발 속도와 높은 생산성
- ✅ SSR/SSG 지원으로 SEO 최적화
- ✅ App Router로 최신 React 기능 활용
- ✅ 내장 API Routes로 풀스택 개발
- ✅ Vercel 배포로 쉬운 확장성
- ✅ PWA 지원으로 모바일 앱과 유사한 경험

**상태 관리**: Zustand
- ✅ 가벼운 상태 관리 라이브러리
- ✅ TypeScript 지원 우수
- ✅ 보일러플레이트 코드 최소화
- ✅ React Native로의 마이그레이션 용이

**UI 라이브러리**: Tailwind CSS + shadcn/ui
- ✅ 빠른 스타일링과 일관된 디자인
- ✅ 접근성 고려된 컴포넌트
- ✅ 커스터마이징 용이
- ✅ 반응형 디자인 지원

### 2.2 백엔드
**Next.js API Routes** (선택 근거)
- ✅ 풀스택 개발로 개발 속도 향상
- ✅ TypeScript 지원으로 타입 안정성
- ✅ Vercel Edge Functions로 글로벌 배포
- ✅ 서버리스 아키텍처로 확장성
- ✅ WebSocket 지원 (Socket.io)

**데이터베이스 ORM**: Prisma
- ✅ TypeScript 기반 타입 안전한 ORM
- ✅ 자동 마이그레이션
- ✅ 스키마 시각화
- ✅ 성능 최적화된 쿼리

### 2.3 데이터베이스
**PostgreSQL** (메인 DB)
- ✅ ACID 트랜잭션
- ✅ JSON 지원으로 유연성
- ✅ 복잡한 쿼리 최적화
- ✅ 확장성

**Redis** (캐시/세션)
- ✅ 실시간 리더보드 캐싱
- ✅ 세션 관리
- ✅ 임시 데이터 저장

### 2.4 인프라
**Vercel** (클라우드 플랫폼)
- ✅ Next.js 최적화된 배포 환경
- ✅ 글로벌 CDN으로 빠른 로딩
- ✅ 자동 CI/CD
- ✅ 서버리스 함수 지원
- ✅ 무료 티어 제공

**PlanetScale** (데이터베이스 호스팅)
- ✅ MySQL 호환 (Prisma 지원)
- ✅ 자동 백업 및 복구
- ✅ 브랜치 기반 개발
- ✅ 무료 티어 제공

### 2.5 추가 기술
- **Socket.io**: 실시간 통신
- **NextAuth.js**: 인증 시스템
- **Google AdSense**: 배너 광고
- **GitHub Actions**: CI/CD
- **Framer Motion**: 애니메이션
- **React Hook Form**: 폼 관리

---

## 3. 시스템 아키텍처

### 3.1 전체 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile Web    │    │   Admin Panel   │
│   (Next.js)     │    │   (PWA)         │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Next.js App   │
                    │   (API Routes)  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PlanetScale   │    │   Upstash Redis │    │   Vercel Storage│
│   (MySQL)       │    │   (Cache)       │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 3.2 모듈 구조
1. **Auth Module**: NextAuth.js 기반 인증
2. **Game Module**: 게임 로직, 점수 계산
3. **Leaderboard Module**: 리더보드 관리
4. **Content Module**: 문항 관리, 오답노트
5. **Analytics Module**: 통계, 분석
6. **Admin Module**: 관리자 기능

---

## 4. 데이터베이스 설계

### 4.1 핵심 테이블

#### users (사용자)
```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY, -- NextAuth.js user ID
    nickname VARCHAR(20) NOT NULL UNIQUE,
    age_band VARCHAR(10) NOT NULL, -- '유치', '초저', '초중', '초고', '중', '고'
    org_code VARCHAR(10), -- 학교/학원 코드
    email VARCHAR(255) UNIQUE,
    image VARCHAR(255), -- 프로필 이미지
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    total_rounds INTEGER DEFAULT 0,
    total_score BIGINT DEFAULT 0,
    current_streak INTEGER DEFAULT 0
);
```

#### rounds (라운드)
```sql
CREATE TABLE rounds (
    id VARCHAR(255) PRIMARY KEY, -- UUID
    user_id VARCHAR(255) REFERENCES users(id),
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP,
    score INTEGER NOT NULL,
    accuracy DECIMAL(5,2) NOT NULL, -- 정확도 %
    avg_response_time INTEGER NOT NULL, -- 평균 반응시간 (ms)
    max_combo INTEGER DEFAULT 0,
    difficulty_profile JSON, -- 난이도 분포
    is_valid BOOLEAN DEFAULT true, -- 유효한 라운드 여부
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### round_items (라운드 내 문항)
```sql
CREATE TABLE round_items (
    id VARCHAR(255) PRIMARY KEY, -- UUID
    round_id VARCHAR(255) REFERENCES rounds(id),
    item_id VARCHAR(255) REFERENCES word_items(id),
    is_correct BOOLEAN NOT NULL,
    response_time INTEGER NOT NULL, -- 응답시간 (ms)
    attempt_count INTEGER DEFAULT 1,
    item_difficulty DECIMAL(3,2), -- 문항 난이도
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### word_items (영어 단어 문항)
```sql
CREATE TABLE word_items (
    id VARCHAR(255) PRIMARY KEY, -- UUID
    headword VARCHAR(100) NOT NULL, -- 영어 단어
    pos VARCHAR(20), -- 품사
    sense_key VARCHAR(50), -- 의미 키
    ko_gloss TEXT NOT NULL, -- 한국어 뜻
    difficulty_beta DECIMAL(3,2) NOT NULL, -- 난이도 계수
    tags JSON, -- 태그 (주제, 오답 유형 등)
    question_type VARCHAR(20) NOT NULL, -- T1, T2, T3, T4, T5
    options JSON, -- 객관식 보기 (T1, T2, T4, T5용)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### leaderboard_week (주간 리더보드)
```sql
CREATE TABLE leaderboard_week (
    id VARCHAR(255) PRIMARY KEY, -- UUID
    user_id VARCHAR(255) REFERENCES users(id),
    week_id VARCHAR(10) NOT NULL, -- '2024-W01' 형식
    weighted_score INTEGER NOT NULL, -- 가중 점수
    rank INTEGER NOT NULL,
    board_type VARCHAR(20) NOT NULL, -- 'global', 'school', 'group'
    org_code VARCHAR(10),
    valid_rounds_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_id, board_type)
);
```

#### wrong_answers (오답노트)
```sql
CREATE TABLE wrong_answers (
    id VARCHAR(255) PRIMARY KEY, -- UUID
    user_id VARCHAR(255) REFERENCES users(id),
    item_id VARCHAR(255) REFERENCES word_items(id),
    wrong_count INTEGER DEFAULT 1,
    last_wrong_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mastered_at TIMESTAMP, -- 완전히 익힌 시점
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, item_id)
);
```

### 4.2 인덱스 전략
```sql
-- 리더보드 조회 최적화
CREATE INDEX idx_leaderboard_week_lookup ON leaderboard_week(week_id, board_type, rank);
CREATE INDEX idx_leaderboard_user ON leaderboard_week(user_id, week_id);

-- 라운드 조회 최적화
CREATE INDEX idx_rounds_user_time ON rounds(user_id, created_at DESC);
CREATE INDEX idx_rounds_valid ON rounds(is_valid, created_at);

-- 오답노트 조회 최적화
CREATE INDEX idx_wrong_answers_user ON wrong_answers(user_id, last_wrong_at DESC);

-- 문항 조회 최적화
CREATE INDEX idx_word_items_difficulty ON word_items(difficulty_beta, question_type);
CREATE INDEX idx_word_items_tags ON word_items((CAST(tags AS CHAR(1000))));
```

---

## 5. API 설계

### 5.1 Next.js API Routes

#### 사용자 관리
```
POST   /api/auth/register        # 회원가입
GET    /api/auth/session         # 세션 조회
PUT    /api/auth/profile         # 프로필 수정
```

#### 게임 플레이
```
POST   /api/game/start           # 라운드 시작
POST   /api/game/answer          # 답안 제출
POST   /api/game/end             # 라운드 종료
GET    /api/game/items           # 문항 조회
```

#### 리더보드
```
GET    /api/leaderboard/global       # 글로벌 리더보드
GET    /api/leaderboard/school       # 학교 리더보드
GET    /api/leaderboard/group        # 그룹 리더보드
GET    /api/leaderboard/friends      # 친구 리더보드
```

#### 오답노트
```
GET    /api/wrong-answers            # 오답 목록
POST   /api/wrong-answers/practice   # 오답 연습
PUT    /api/wrong-answers/master     # 완전히 익힘 표시
```

#### 통계
```
GET    /api/stats/user               # 사용자 통계
GET    /api/stats/percentile         # 퍼센타일 조회
GET    /api/stats/trends             # 성장 추이
```

### 5.2 WebSocket 이벤트
```javascript
// 클라이언트 → 서버
'game:join'          // 게임 참여
'game:answer'        // 답안 제출
'game:leave'         // 게임 나가기

// 서버 → 클라이언트
'game:start'         // 게임 시작
'game:question'      // 새 문항
'game:result'        // 답안 결과
'game:end'           // 게임 종료
'leaderboard:update' // 리더보드 업데이트
```

---

## 6. 핵심 기능 구현 가이드

### 6.1 게임 엔진 설계

#### 점수 계산 알고리즘
```python
def calculate_score(base_score, difficulty_coeff, speed_coeff, combo_coeff):
    """
    문항 점수 계산
    """
    return int(base_score * difficulty_coeff * speed_coeff * combo_coeff)

def calculate_speed_coefficient(response_time, avg_response_time):
    """
    속도 계수 계산 (가우시안 분포 기반)
    """
    if response_time <= avg_response_time * 0.5:
        return 1.5  # 매우 빠름
    elif response_time <= avg_response_time * 0.8:
        return 1.2  # 빠름
    elif response_time <= avg_response_time * 1.2:
        return 1.0  # 평균
    elif response_time <= avg_response_time * 1.5:
        return 0.8  # 느림
    else:
        return 0.6  # 매우 느림

def calculate_combo_coefficient(combo_count):
    """
    콤보 계수 계산
    """
    if combo_count >= 15:
        return 1.15
    elif combo_count >= 10:
        return 1.10
    elif combo_count >= 5:
        return 1.05
    else:
        return 1.0
```

#### 난이도 적응 시스템
```python
class AdaptiveDifficulty:
    def __init__(self):
        self.user_theta = 0.0  # 사용자 실력
        self.confidence = 0.5  # 신뢰도
    
    def update_ability(self, item_difficulty, is_correct, response_time):
        """
        IRT 기반 사용자 실력 업데이트
        """
        # 간단한 IRT 구현
        expected_prob = 1 / (1 + math.exp(-(self.user_theta - item_difficulty)))
        actual = 1 if is_correct else 0
        
        # 실력 업데이트
        self.user_theta += 0.1 * (actual - expected_prob)
        
        return self.user_theta
    
    def get_next_difficulty(self):
        """
        다음 문항 난이도 추천
        """
        return max(0.1, min(2.0, self.user_theta + random.normal(0, 0.3)))
```

### 6.2 리더보드 시스템

#### 실시간 리더보드 업데이트
```python
class LeaderboardManager:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def update_leaderboard(self, user_id, score, board_type, org_code=None):
        """
        리더보드 실시간 업데이트
        """
        key = f"leaderboard:{board_type}:{org_code or 'global'}"
        
        # Redis Sorted Set 사용
        self.redis.zadd(key, {str(user_id): score})
        
        # 상위 100명만 유지
        self.redis.zremrangebyrank(key, 0, -101)
        
        # WebSocket으로 실시간 업데이트 브로드캐스트
        self.broadcast_update(board_type, org_code)
    
    def get_leaderboard(self, board_type, org_code=None, limit=50):
        """
        리더보드 조회
        """
        key = f"leaderboard:{board_type}:{org_code or 'global'}"
        return self.redis.zrevrange(key, 0, limit-1, withscores=True)
```

### 6.3 오답노트 시스템

#### 오답 관리 및 복습
```python
class WrongAnswerManager:
    def add_wrong_answer(self, user_id, item_id):
        """
        오답 추가
        """
        # 오답 테이블에 추가/업데이트
        query = """
        INSERT INTO wrong_answers (user_id, item_id, wrong_count, last_wrong_at)
        VALUES (%s, %s, 1, NOW())
        ON CONFLICT (user_id, item_id)
        DO UPDATE SET 
            wrong_count = wrong_answers.wrong_count + 1,
            last_wrong_at = NOW()
        """
        # DB 실행
    
    def get_wrong_answers(self, user_id, limit=20):
        """
        오답 목록 조회 (최근 틀린 순)
        """
        query = """
        SELECT wa.*, wi.*
        FROM wrong_answers wa
        JOIN word_items wi ON wa.item_id = wi.id
        WHERE wa.user_id = %s AND wa.mastered_at IS NULL
        ORDER BY wa.last_wrong_at DESC
        LIMIT %s
        """
        # DB 실행 및 반환
    
    def mark_as_mastered(self, user_id, item_id):
        """
        완전히 익힘 표시
        """
        query = """
        UPDATE wrong_answers 
        SET mastered_at = NOW()
        WHERE user_id = %s AND item_id = %s
        """
        # DB 실행
```

---

## 7. 개발 일정 및 마일스톤

### 7.1 8주 개발 계획

#### Week 1-2: 기반 구축
- [ ] 프로젝트 설정 및 개발 환경 구축
- [ ] 데이터베이스 스키마 구현
- [ ] 기본 API 엔드포인트 구현
- [ ] 사용자 인증 시스템

#### Week 3-4: 핵심 게임 기능
- [ ] 게임 엔진 구현
- [ ] 점수 계산 알고리즘
- [ ] 실시간 게임 플레이
- [ ] 기본 UI 구현

#### Week 5-6: 리더보드 및 통계
- [ ] 리더보드 시스템 구현
- [ ] 퍼센타일/스테나인 계산
- [ ] 오답노트 기능
- [ ] 통계 대시보드

#### Week 7-8: 최적화 및 배포
- [ ] 성능 최적화
- [ ] 광고 시스템 연동
- [ ] 보안 강화
- [ ] 배포 및 모니터링

### 7.2 마일스톤
- **M1 (Week 2)**: 기본 인프라 완성
- **M2 (Week 4)**: 핵심 게임 기능 완성
- **M3 (Week 6)**: 리더보드 및 통계 완성
- **M4 (Week 8)**: 전체 시스템 완성 및 배포

---

## 8. 배포 및 운영 전략

### 8.1 배포 아키텍처
```
┌─────────────────┐    ┌─────────────────┐
│   Vercel Edge   │    │   Vercel DNS    │
│   (CDN)         │    │   (DNS)         │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Vercel        │
                    │   (Serverless)  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PlanetScale   │    │   Upstash Redis │    │   Vercel Storage│
│   (MySQL)       │    │   (Cache)       │    │   (Files)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 8.2 CI/CD 파이프라인
```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### 8.3 모니터링 및 로깅
- **Vercel Analytics**: 성능 모니터링
- **Sentry**: 에러 추적
- **PlanetScale Insights**: 데이터베이스 모니터링
- **Custom Metrics**: 게임 관련 지표

---

## 9. 성능 최적화 가이드

### 9.1 데이터베이스 최적화
- **인덱스 최적화**: 복합 인덱스 활용
- **쿼리 최적화**: N+1 문제 해결
- **Connection Pooling**: 연결 풀 관리
- **Read Replicas**: 읽기 전용 복제본

### 9.2 캐싱 전략
```python
# Redis 캐싱 예시
class CacheManager:
    def __init__(self, redis_client):
        self.redis = redis_client
    
    def get_leaderboard(self, board_type, org_code=None):
        """
        리더보드 캐싱
        """
        key = f"leaderboard:{board_type}:{org_code or 'global'}"
        cached = self.redis.get(key)
        
        if cached:
            return json.loads(cached)
        
        # DB에서 조회
        data = self.fetch_from_db(board_type, org_code)
        
        # 5분간 캐싱
        self.redis.setex(key, 300, json.dumps(data))
        return data
```

### 9.3 프론트엔드 최적화
- **Next.js 성능 최적화**
  - Image 컴포넌트 사용
  - 메모이제이션 (React.memo, useMemo)
  - 동적 임포트 (lazy loading)
- **번들 크기 최적화**
  - Tree shaking
  - 코드 스플리팅
  - PWA 최적화

---

## 10. 보안 고려사항

### 10.1 인증 및 권한
- **JWT 토큰**: 안전한 토큰 관리
- **Rate Limiting**: API 호출 제한
- **CORS 설정**: 도메인 제한
- **Input Validation**: 입력값 검증

### 10.2 데이터 보호
- **개인정보 최소화**: 필요한 정보만 수집
- **암호화**: 민감 데이터 암호화
- **백업**: 정기적인 데이터 백업
- **GDPR 준수**: 개인정보 보호법 준수

### 10.3 부정행위 방지
```python
class AntiCheatSystem:
    def validate_round(self, round_data):
        """
        라운드 유효성 검증
        """
        # 응답시간 검증
        if round_data.avg_response_time < 200:  # 200ms 미만은 의심
            return False
        
        # 패턴 검증
        if self.detect_pattern(round_data):
            return False
        
        # 정확도 검증
        if round_data.accuracy > 95 and round_data.avg_response_time < 500:
            return False
        
        return True
    
    def detect_pattern(self, round_data):
        """
        부정행위 패턴 감지
        """
        # 일정한 응답시간 패턴
        # 비정상적으로 높은 정확도
        # 특정 시간대 집중 사용
        pass
```

---

## 11. 테스트 전략

### 11.1 테스트 종류
- **Unit Tests**: 개별 함수/클래스 테스트
- **Integration Tests**: API 엔드포인트 테스트
- **E2E Tests**: 전체 플로우 테스트
- **Performance Tests**: 성능 테스트

### 11.2 테스트 도구
- **Backend**: Jest, Supertest
- **Frontend**: Jest, React Testing Library
- **E2E**: Playwright
- **Performance**: k6, Artillery

---

## 12. 결론

이 개발 가이드는 WordRush 서비스의 성공적인 구현을 위한 종합적인 로드맵을 제공합니다. 

### 12.1 핵심 성공 요인
1. **빠른 개발**: Next.js 풀스택 개발로 빠른 개발
2. **확장성**: 서버리스 아키텍처로 확장 가능
3. **성능**: Vercel Edge Functions와 최적화된 DB 설계
4. **사용자 경험**: PWA 지원과 직관적인 UI

### 12.2 다음 단계
1. **프로토타입 개발**: 핵심 기능 우선 구현
2. **사용자 테스트**: 파일럿 테스트 진행
3. **피드백 수집**: 사용자 피드백 기반 개선
4. **점진적 출시**: MVP부터 시작하여 기능 확장

이 가이드를 바탕으로 체계적이고 효율적인 개발을 진행하시기 바랍니다.
