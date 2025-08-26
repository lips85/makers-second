// 오답 노트 데이터 타입 정의

export interface WrongAnswerItem {
  id: string; // word_item_id
  word: string;
  meaning: string;
  difficulty: "easy" | "medium" | "hard";
  category?: string;
  wrongCount: number;
  lastWrongAt: string; // ISO date string
  masteredAt?: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface WrongAnswerStore {
  items: WrongAnswerItem[];
  version: string;
  lastUpdated: string; // ISO date string
  maxItems: number;
}

// 로컬 스토리지 키 규약
export const WRONG_ANSWERS_STORAGE_KEY = "Word Rush_wrong_answers";
export const WRONG_ANSWERS_VERSION = "1.0.0";
export const MAX_WRONG_ANSWERS = 100; // 최대 저장 개수

// 기본 저장소 상태
export const DEFAULT_WRONG_ANSWER_STORE: WrongAnswerStore = {
  items: [],
  version: WRONG_ANSWERS_VERSION,
  lastUpdated: new Date().toISOString(),
  maxItems: MAX_WRONG_ANSWERS,
};

// 유틸리티 함수들

/**
 * 오답 아이템 중복 병합
 */
export function mergeWrongAnswerItems(
  existingItems: WrongAnswerItem[],
  newItems: WrongAnswerItem[]
): WrongAnswerItem[] {
  const itemMap = new Map<string, WrongAnswerItem>();

  // 기존 아이템들을 맵에 추가
  existingItems.forEach((item) => {
    itemMap.set(item.id, item);
  });

  // 새 아이템들을 병합
  newItems.forEach((newItem) => {
    const existing = itemMap.get(newItem.id);
    if (existing) {
      // 기존 아이템이 있으면 wrongCount 증가 및 시간 업데이트
      itemMap.set(newItem.id, {
        ...existing,
        wrongCount: existing.wrongCount + newItem.wrongCount,
        lastWrongAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      // 새 아이템 추가
      itemMap.set(newItem.id, newItem);
    }
  });

  return Array.from(itemMap.values());
}

/**
 * 오답 아이템 정렬
 */
export function sortWrongAnswerItems(
  items: WrongAnswerItem[],
  sortBy: "lastWrongAt" | "wrongCount" | "word" | "createdAt" = "lastWrongAt",
  order: "asc" | "desc" = "desc"
): WrongAnswerItem[] {
  return [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case "lastWrongAt":
        comparison =
          new Date(a.lastWrongAt).getTime() - new Date(b.lastWrongAt).getTime();
        break;
      case "wrongCount":
        comparison = a.wrongCount - b.wrongCount;
        break;
      case "word":
        comparison = a.word.localeCompare(b.word);
        break;
      case "createdAt":
        comparison =
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }

    return order === "desc" ? -comparison : comparison;
  });
}

/**
 * 오답 아이템 필터링
 */
export function filterWrongAnswerItems(
  items: WrongAnswerItem[],
  filters: {
    search?: string;
    difficulty?: "easy" | "medium" | "hard";
    mastered?: boolean;
    category?: string;
  }
): WrongAnswerItem[] {
  return items.filter((item) => {
    // 검색어 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        item.word.toLowerCase().includes(searchLower) ||
        item.meaning.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // 난이도 필터
    if (filters.difficulty && item.difficulty !== filters.difficulty) {
      return false;
    }

    // 마스터 상태 필터
    if (filters.mastered !== undefined) {
      const isMastered = !!item.masteredAt;
      if (isMastered !== filters.mastered) return false;
    }

    // 카테고리 필터
    if (filters.category && item.category !== filters.category) {
      return false;
    }

    return true;
  });
}

/**
 * 입력 가드 로직 - 최대 저장 개수 확인
 */
export function validateWrongAnswerStore(store: WrongAnswerStore): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 최대 아이템 개수 확인
  if (store.items.length > store.maxItems) {
    errors.push(`최대 저장 가능한 오답 개수(${store.maxItems})를 초과했습니다`);
  }

  // 버전 확인
  if (store.version !== WRONG_ANSWERS_VERSION) {
    errors.push("오답 노트 버전이 일치하지 않습니다");
  }

  // 아이템 유효성 확인
  store.items.forEach((item, index) => {
    if (!item.id || !item.word || !item.meaning) {
      errors.push(`아이템 ${index + 1}의 필수 필드가 누락되었습니다`);
    }

    if (item.wrongCount < 1) {
      errors.push(`아이템 ${index + 1}의 틀린 횟수가 유효하지 않습니다`);
    }

    if (!["easy", "medium", "hard"].includes(item.difficulty)) {
      errors.push(`아이템 ${index + 1}의 난이도가 유효하지 않습니다`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * 오답 아이템 생성
 */
export function createWrongAnswerItem(wordItem: {
  id: string;
  word: string;
  meaning: string;
  difficulty: "easy" | "medium" | "hard";
  category?: string;
}): WrongAnswerItem {
  const now = new Date().toISOString();

  return {
    id: wordItem.id,
    word: wordItem.word,
    meaning: wordItem.meaning,
    difficulty: wordItem.difficulty,
    category: wordItem.category,
    wrongCount: 1,
    lastWrongAt: now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 오답 아이템 마스터 표시
 */
export function markWrongAnswerAsMastered(
  item: WrongAnswerItem
): WrongAnswerItem {
  return {
    ...item,
    masteredAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * 오답 아이템 틀린 횟수 증가
 */
export function incrementWrongAnswerCount(
  item: WrongAnswerItem
): WrongAnswerItem {
  return {
    ...item,
    wrongCount: item.wrongCount + 1,
    lastWrongAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
