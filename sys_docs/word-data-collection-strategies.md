# 단어 데이터 수집 전략 및 방법론

## 📋 문서 개요

Word Rush 프로젝트의 핵심 자원인 영어 단어 데이터를 효과적으로 수집하고 관리하기 위한 전략과 방법을 정리한 문서입니다. 초기 MVP 출시를 위해 1000개 이상의 단어를 확보하는 것을 목표로 합니다.

## 🎯 수집 목표 및 요구사항

### 목표 수량

- **MVP 단계**: 1000개 단어 (기초 400개, 중급 400개, 고급 200개)
- **1단계 확장**: 3000개 단어
- **최종 목표**: 10000개 단어

### 데이터 품질 요구사항

- **정확성**: 올바른 영어 철자와 뜻
- **난이도 분류**: 초급/중급/고급 명확한 구분
- **카테고리**: 학교/일상/비즈니스 등 상황별 분류
- **예문**: 각 단어별 1-2개의 자연스러운 예문

---

## 🚀 단어 수집 전략

### 전략 1: 공공 데이터베이스 및 교육 자료 활용

#### 학교 교육과정 단어 목록

```typescript
// 활용 가능한 자료들
const educationalSources = [
  "초등학교 영어 교과서 단어",
  "중학교 영어 단어장",
  "고등학교 영어 단어 목록",
  "TOEIC 기초 단어",
  "토익스피킹 필수 단어",
];
```

**장점:**

- ✅ 교육적 타당성 높음
- ✅ 난이도 분류 용이
- ✅ 저작권 문제 적음

**단점:**

- ❌ 수집량 제한적
- ❌ 최신 트렌드 단어 부족

#### 구현 방법

```bash
# 1. 교육부 자료 수집
curl -o elementary_words.txt "교육부_초등영어_단어_목록.pdf"

# 2. 텍스트 추출 및 정제
python extract_words.py elementary_words.txt

# 3. 데이터베이스 저장
npm run seed:educational-words
```

### 전략 2: 사전 API 활용

#### Oxford Dictionary API

```typescript
interface OxfordWordData {
  word: string;
  phonetic: string;
  definitions: string[];
  examples: string[];
  difficulty: "easy" | "medium" | "hard";
}

// API 호출 예시
const fetchOxfordWord = async (word: string) => {
  const response = await fetch(
    `https://od-api.oxforddictionaries.com/api/v2/entries/en/${word}`,
    {
      headers: {
        app_id: process.env.OXFORD_APP_ID,
        app_key: process.env.OXFORD_APP_KEY,
      },
    }
  );
  return await response.json();
};
```

**활용 가능한 API들:**

- **Oxford Dictionary API**: 학술적 사전 데이터
- **Merriam-Webster API**: 미국 영어 사전
- **Cambridge Dictionary API**: 영국 영어 사전
- **Wordnik API**: 크라우드소싱 사전

**장점:**

- ✅ 정확하고 풍부한 데이터
- ✅ 발음기호, 예문 제공
- ✅ 자동화 가능

**단점:**

- ❌ 유료 API (월간 사용량 제한)
- ❌ 한국어 뜻 번역 필요

#### 구현 계획

```typescript
// 1. API 키 발급 및 설정
// 2. 단어 목록 생성 스크립트
// 3. 배치 처리로 데이터 수집
// 4. 한국어 번역 자동화
// 5. 난이도 자동 분류
```

### 전략 3: 웹 스크래핑

#### 교육 사이트 단어장 수집

```python
# Python BeautifulSoup 활용 예시
from bs4 import BeautifulSoup
import requests

def scrape_english_words(url: str) -> List[Dict]:
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')

    words = []
    for word_element in soup.find_all('div', class_='word-item'):
        word_data = {
            'word': word_element.find('h3').text,
            'meaning': word_element.find('p', class_='meaning').text,
            'difficulty': extract_difficulty(word_element),
            'category': extract_category(word_element)
        }
        words.append(word_data)

    return words
```

**타겟 사이트들:**

- **영어교육 전문 사이트**: Riiid, Racha 등
- **단어장 공유 사이트**: Memrise, Quizlet 공개 단어장
- **교육 블로그**: 영어 교육 관련 블로그 포스트

**장점:**

- ✅ 무료로 대량 수집 가능
- ✅ 한국어 뜻 포함된 자료 많음
- ✅ 빠른 데이터 확보

**단점:**

- ❌ 저작권 및 이용약관 위반 가능성
- ❌ 데이터 품질 불균일
- ❌ 자동화에 법적 제한

### 전략 4: 크라우드소싱 및 사용자 참여

#### 교사용 단어 등록 시스템

```typescript
// 교사 전용 단어 등록 인터페이스
interface TeacherWordSubmission {
  word: string;
  meaning: string;
  difficulty: string;
  category: string;
  exampleSentence?: string;
  submitterId: string;
  schoolInfo?: string;
}

// 승인 워크플로우
enum SubmissionStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  NEEDS_REVISION = "needs_revision",
}
```

**장점:**

- ✅ 실제 교육 현장 단어 확보
- ✅ 품질 검증 가능
- ✅ 지속적인 데이터 축적

**단점:**

- ❌ 초기 데이터 확보 지연
- ❌ 검수 프로세스 필요

### 전략 5: AI 기반 단어 생성

#### GPT 모델 활용

```typescript
const generateWordsWithGPT = async (
  category: string,
  difficulty: string,
  count: number
) => {
  const prompt = `
  ${category} 주제의 ${difficulty} 난이도 영어 단어 ${count}개를 생성해주세요.
  각 단어는 다음 형식을 따라주세요:
  - 영어 단어
  - 한국어 뜻
  - 사용 예문
  - 난이도 분류

  형식:
  단어: [영어]
  뜻: [한국어]
  예문: [영어 예문]
  난이도: ${difficulty}
  ---

  예시:
  단어: algorithm
  뜻: 알고리즘
  예문: The computer uses a complex algorithm to solve the problem.
  난이도: medium
  `;

  // OpenAI API 호출
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  return parseGeneratedWords(response.choices[0].message.content);
};
```

**활용 분야:**

- **틈새 단어 채우기**: 기존 데이터의 부족한 부분 보완
- **맞춤형 단어 생성**: 특정 주제나 상황별 단어
- **난이도 균형 조정**: 부족한 난이도 레벨 단어 생성

**장점:**

- ✅ 맞춤형 단어 생성 가능
- ✅ 빠른 대량 생산
- ✅ 창의적 단어 확보

**단점:**

- ❌ API 비용 발생
- ❌ 정확성 검증 필요
- ❌ 교육적 타당성 검토 필요

---

## 📊 데이터 수집 로드맵

### Phase 1: 초기 데이터 수집 (1주)

```bash
# Week 1 목표: 1000개 단어 확보

# 1일차: 교육 자료 수집
npm run collect:educational-words

# 2일차: 공개 단어장 활용
npm run collect:public-wordlists

# 3일차: API 기반 수집
npm run collect:api-words

# 4-5일차: 데이터 정제 및 검증
npm run validate:word-data
npm run deduplicate:words

# 6-7일차: 데이터베이스 적재
npm run seed:words
```

### Phase 2: 품질 향상 및 확장 (2주)

```bash
# Week 2-3: 품질 개선
npm run enhance:word-examples     # 예문 추가
npm run categorize:words          # 카테고리 분류
npm run validate:difficulty       # 난이도 검증

# Week 4: 추가 수집
npm run collect:specialized-words # 전문 분야 단어
npm run generate:ai-words         # AI 생성 단어
```

### Phase 3: 지속적 관리 시스템 구축 (1주)

```typescript
// 자동화된 단어 관리 시스템
const wordManagementSystem = {
  // 정기적인 품질 검증
  qualityChecks: ["duplicate_check", "accuracy_validation", "usage_tracking"],

  // 사용자 피드백 수집
  userFeedback: ["difficulty_adjustment", "meaning_correction", "new_examples"],

  // 데이터 건강도 모니터링
  healthMetrics: ["word_count", "usage_rate", "accuracy_score"],
};
```

---

## 🛠️ 기술 구현 방안

### 데이터 수집 파이프라인

```typescript
interface WordCollectionPipeline {
  // 1. 데이터 소스
  sources: DataSource[];

  // 2. 수집기
  collectors: Collector[];

  // 3. 변환기
  transformers: Transformer[];

  // 4. 검증기
  validators: Validator[];

  // 5. 저장소
  repository: WordRepository;
}

class WordCollectionService {
  async collectWords(targetCount: number): Promise<WordItem[]> {
    const pipeline = new WordCollectionPipeline();

    // 1. 다중 소스에서 데이터 수집
    const rawData = await pipeline.collectFromSources();

    // 2. 데이터 정제 및 표준화
    const cleanedData = await pipeline.transformData(rawData);

    // 3. 품질 검증
    const validatedData = await pipeline.validateData(cleanedData);

    // 4. 중복 제거 및 병합
    const uniqueData = await pipeline.deduplicate(validatedData);

    return uniqueData.slice(0, targetCount);
  }
}
```

### 데이터 품질 관리 시스템

```typescript
interface WordQualityManager {
  // 정확성 검증
  validateAccuracy(word: WordItem): Promise<boolean>;

  // 난이도 자동 분류
  classifyDifficulty(word: string): Promise<"easy" | "medium" | "hard">;

  // 사용 빈도 분석
  analyzeUsage(word: WordItem): Promise<UsageMetrics>;

  // 품질 점수 계산
  calculateQualityScore(word: WordItem): number;
}
```

---

## 📋 실행 계획 및 타임라인

### Week 1: 기초 인프라 구축

- [ ] 단어 데이터베이스 스키마 최종화
- [ ] 수집 스크립트 기본 틀 구현
- [ ] 품질 검증 시스템 설계
- [ ] 초기 200개 단어 수동 수집

### Week 2: 자동화 시스템 개발

- [ ] 교육 자료 자동 수집기 구현
- [ ] API 연동 시스템 구축
- [ ] 데이터 정제 파이프라인 개발
- [ ] 목표: 600개 단어 확보

### Week 3: 확장 및 최적화

- [ ] 추가 데이터 소스 연동
- [ ] AI 기반 단어 생성 시스템
- [ ] 크라우드소싱 인터페이스 개발
- [ ] 목표: 1000개 단어 확보

### Week 4: 검증 및 안정화

- [ ] 전체 데이터 품질 검증
- [ ] 중복 및 오류 데이터 정리
- [ ] 성능 테스트 및 최적화
- [ ] MVP 출시 준비 완료

---

## ⚠️ 리스크 및 대응 방안

### 법적 리스크

```typescript
const legalConsiderations = {
  copyright: {
    risk: "타사 콘텐츠 저작권 침해",
    mitigation: [
      "공개 라이선스 자료만 활용",
      "변형하여 자체 콘텐츠화",
      "법률 자문 구하기",
    ],
  },

  dataPrivacy: {
    risk: "사용자 데이터 수집 시 개인정보 문제",
    mitigation: ["최소한의 데이터만 수집", "동의 기반 수집", "GDPR 준수"],
  },
};
```

### 기술적 리스크

```typescript
const technicalRisks = {
  apiRateLimits: {
    risk: "API 사용량 제한으로 인한 수집 중단",
    mitigation: ["다중 API 키 사용", "요청 간격 조절", "캐싱 전략 적용"],
  },

  dataQuality: {
    risk: "부정확한 단어 데이터 축적",
    mitigation: [
      "자동 검증 시스템",
      "수동 검토 프로세스",
      "사용자 피드백 수집",
    ],
  },
};
```

---

## 📊 성공 지표 및 모니터링

### 수량 지표

- **일일 목표**: 최소 50개 단어 수집
- **품질 목표**: 95% 이상 정확도
- **분포 목표**: 난이도별 균형 분포

### 품질 지표

- **정확성**: 철자 및 뜻의 정확도
- **완전성**: 필수 필드(단어, 뜻, 난이도) 100% 채움
- **일관성**: 데이터 포맷 및 분류 기준 준수

### 활용 지표

- **사용률**: 게임에서 단어 활용도
- **피드백**: 사용자 수정 요청 수
- **만족도**: 단어 품질 사용자 평가

---

## 💰 비용 및 리소스 계획

### API 비용 예산

```typescript
const costEstimate = {
  oxfordDictionary: {
    monthly: 50, // $50/월
    wordsPerMonth: 5000,
  },
  merriamWebster: {
    monthly: 30, // $30/월
    wordsPerMonth: 3000,
  },
  openai: {
    monthly: 20, // $20/월 (단어 생성용)
    wordsPerMonth: 1000,
  },
  totalMonthly: 100, // $100/월
};
```

### 인력 리소스

- **개발자 1명**: 자동화 시스템 개발 (40시간/주)
- **데이터 전문가 1명**: 수동 검증 및 품질 관리 (20시간/주)
- **디자이너 0.5명**: 사용자 인터페이스 설계 (10시간/주)

---

## 🎯 결론 및 권장사항

### 최적의 혼합 전략

1. **주력 (60%)**: 교육 자료 및 공개 단어장 활용
2. **보조 (30%)**: 사전 API를 통한 고품질 데이터 확보
3. **보완 (10%)**: AI 생성으로 틈새 단어 채우기

### 단계적 접근 권장

```typescript
const recommendedApproach = {
  immediate: [
    "교육 자료 수집부터 시작",
    "기존 공개 단어장 활용",
    "간단한 검증 시스템 구축",
  ],

  shortTerm: [
    "API 연동 시스템 개발",
    "자동화 파이프라인 구축",
    "품질 관리 프로세스 수립",
  ],

  longTerm: [
    "크라우드소싱 플랫폼 구축",
    "AI 기반 개인화 단어 생성",
    "지속적 데이터 품질 관리",
  ],
};
```

이 전략을 따르면 MVP 출시 시점에 충분한 양과 품질의 단어 데이터를 확보할 수 있으며, 향후 지속적인 데이터 관리가 가능합니다.
