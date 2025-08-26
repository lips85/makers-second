-- 퍼센타일 및 스테나인 계산 함수
-- 모드·기간 필터를 고려한 정확한 퍼센타일 계산

-- 1. 퍼센타일 계산 함수
CREATE OR REPLACE FUNCTION calculate_percentile(
  target_score INTEGER,
  period_type leaderboard_period DEFAULT 'daily',
  duration_sec INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  total_count INTEGER;
  below_count INTEGER;
  percentile INTEGER;
BEGIN
  -- 기간별 필터링된 점수 데이터 조회
  SELECT 
    COUNT(*) as total,
    COUNT(CASE WHEN score < target_score THEN 1 END) as below
  INTO total_count, below_count
  FROM leaderboards l
  WHERE l.period = period_type
    AND (duration_sec IS NULL OR l.duration_sec = duration_sec)
    AND l.created_at >= CASE 
      WHEN period_type = 'daily' THEN CURRENT_DATE
      WHEN period_type = 'weekly' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN period_type = 'monthly' THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN period_type = 'all_time' THEN '1970-01-01'::DATE
      ELSE CURRENT_DATE
    END;

  -- 퍼센타일 계산: (작은 값의 개수 / 전체 개수) * 100
  IF total_count = 0 THEN
    percentile := 0;
  ELSE
    percentile := ROUND((below_count::DECIMAL / total_count) * 100);
  END IF;

  RETURN percentile;
END;
$$ LANGUAGE plpgsql;

-- 2. 스테나인 계산 함수
CREATE OR REPLACE FUNCTION calculate_stanine(
  percentile INTEGER
) RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN percentile >= 96 THEN 9
    WHEN percentile >= 89 THEN 8
    WHEN percentile >= 77 THEN 7
    WHEN percentile >= 60 THEN 6
    WHEN percentile >= 40 THEN 5
    WHEN percentile >= 23 THEN 4
    WHEN percentile >= 11 THEN 3
    WHEN percentile >= 4 THEN 2
    ELSE 1
  END;
END;
$$ LANGUAGE plpgsql;

-- 3. 통합 퍼센타일/스테나인 계산 함수
CREATE OR REPLACE FUNCTION get_percentile_and_stanine(
  target_score INTEGER,
  period_type leaderboard_period DEFAULT 'daily',
  duration_sec INTEGER DEFAULT NULL
) RETURNS TABLE(
  percentile INTEGER,
  stanine INTEGER,
  total_players INTEGER
) AS $$
DECLARE
  calculated_percentile INTEGER;
  calculated_stanine INTEGER;
  total_count INTEGER;
BEGIN
  -- 퍼센타일 계산
  calculated_percentile := calculate_percentile(target_score, period_type, duration_sec);
  
  -- 스테나인 계산
  calculated_stanine := calculate_stanine(calculated_percentile);
  
  -- 전체 플레이어 수 조회
  SELECT COUNT(*)
  INTO total_count
  FROM leaderboards l
  WHERE l.period = period_type
    AND (duration_sec IS NULL OR l.duration_sec = duration_sec)
    AND l.created_at >= CASE 
      WHEN period_type = 'daily' THEN CURRENT_DATE
      WHEN period_type = 'weekly' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN period_type = 'monthly' THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN period_type = 'all_time' THEN '1970-01-01'::DATE
      ELSE CURRENT_DATE
    END;

  RETURN QUERY SELECT calculated_percentile, calculated_stanine, total_count;
END;
$$ LANGUAGE plpgsql;

-- 4. 사용자별 퍼센타일/스테나인 조회 함수
CREATE OR REPLACE FUNCTION get_user_percentile_stats(
  user_id UUID,
  period_type leaderboard_period DEFAULT 'daily'
) RETURNS TABLE(
  user_id UUID,
  score INTEGER,
  percentile INTEGER,
  stanine INTEGER,
  rank_position INTEGER,
  total_players INTEGER
) AS $$
DECLARE
  user_score INTEGER;
  calculated_percentile INTEGER;
  calculated_stanine INTEGER;
  rank_pos INTEGER;
  total_count INTEGER;
BEGIN
  -- 사용자 점수 조회
  SELECT l.score
  INTO user_score
  FROM leaderboards l
  WHERE l.user_id = get_user_percentile_stats.user_id
    AND l.period = period_type
    AND l.created_at >= CASE 
      WHEN period_type = 'daily' THEN CURRENT_DATE
      WHEN period_type = 'weekly' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN period_type = 'monthly' THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN period_type = 'all_time' THEN '1970-01-01'::DATE
      ELSE CURRENT_DATE
    END
  ORDER BY l.score DESC
  LIMIT 1;

  -- 점수가 없으면 NULL 반환
  IF user_score IS NULL THEN
    RETURN QUERY SELECT 
      get_user_percentile_stats.user_id,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::INTEGER,
      NULL::INTEGER;
    RETURN;
  END IF;

  -- 퍼센타일 계산
  calculated_percentile := calculate_percentile(user_score, period_type);
  
  -- 스테나인 계산
  calculated_stanine := calculate_stanine(calculated_percentile);
  
  -- 순위 계산
  SELECT COUNT(*) + 1
  INTO rank_pos
  FROM leaderboards l
  WHERE l.period = period_type
    AND l.score > user_score
    AND l.created_at >= CASE 
      WHEN period_type = 'daily' THEN CURRENT_DATE
      WHEN period_type = 'weekly' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN period_type = 'monthly' THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN period_type = 'all_time' THEN '1970-01-01'::DATE
      ELSE CURRENT_DATE
    END;

  -- 전체 플레이어 수
  SELECT COUNT(*)
  INTO total_count
  FROM leaderboards l
  WHERE l.period = period_type
    AND l.created_at >= CASE 
      WHEN period_type = 'daily' THEN CURRENT_DATE
      WHEN period_type = 'weekly' THEN CURRENT_DATE - INTERVAL '7 days'
      WHEN period_type = 'monthly' THEN CURRENT_DATE - INTERVAL '30 days'
      WHEN period_type = 'all_time' THEN '1970-01-01'::DATE
      ELSE CURRENT_DATE
    END;

  RETURN QUERY SELECT 
    get_user_percentile_stats.user_id,
    user_score,
    calculated_percentile,
    calculated_stanine,
    rank_pos,
    total_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 성능 최적화를 위한 인덱스
-- 리더보드 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_leaderboards_period_created_at 
ON leaderboards(period, created_at);

CREATE INDEX IF NOT EXISTS idx_leaderboards_period_duration_created_at 
ON leaderboards(period, duration_sec, created_at);

CREATE INDEX IF NOT EXISTS idx_leaderboards_period_score_created_at 
ON leaderboards(period, score DESC, created_at);

-- 사용자별 최고 점수 조회 성능 향상
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_period_score 
ON leaderboards(user_id, period, score DESC);

-- 6. 함수 권한 설정
GRANT EXECUTE ON FUNCTION calculate_percentile(INTEGER, leaderboard_period, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stanine(INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_percentile_and_stanine(INTEGER, leaderboard_period, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_user_percentile_stats(UUID, leaderboard_period) TO anon, authenticated;
