-- 리더보드 집계 함수 및 뷰 생성
-- T-005 S1: 리더보드 집계 SQL 뷰/함수 설계 및 생성

-- 1. 리더보드 집계를 위한 뷰 생성
CREATE OR REPLACE VIEW leaderboard_aggregated AS
SELECT 
  l.user_id,
  l.org_id,
  l.period,
  l.scope,
  l.subject,
  l.total_score,
  l.total_rounds,
  l.best_score,
  l.avg_score,
  l.rank_position,
  l.percentile,
  l.last_updated,
  u.display_name,
  u.username,
  o.name as org_name,
  o.code as org_code
FROM leaderboards l
JOIN users u ON l.user_id = u.id
LEFT JOIN orgs o ON l.org_id = o.id
WHERE l.last_updated >= NOW() - INTERVAL '7 days'
  AND u.is_active = true
  AND (o.is_active = true OR o.is_active IS NULL);

-- 2. 퍼센타일 계산 함수
CREATE OR REPLACE FUNCTION calculate_percentile(
  user_score INTEGER,
  scope_filter VARCHAR DEFAULT 'global',
  org_id_filter UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  total_players INTEGER;
  rank_position INTEGER;
  percentile_result INTEGER;
BEGIN
  -- 전체 플레이어 수 계산
  SELECT COUNT(DISTINCT user_id) INTO total_players
  FROM leaderboard_aggregated
  WHERE scope = scope_filter
    AND (org_id_filter IS NULL OR org_id = org_id_filter);
  
  -- 사용자 순위 계산
  SELECT COUNT(*) + 1 INTO rank_position
  FROM leaderboard_aggregated
  WHERE scope = scope_filter
    AND (org_id_filter IS NULL OR org_id = org_id_filter)
    AND total_score > user_score;
  
  -- 퍼센타일 계산 (0-100)
  IF total_players = 0 THEN
    percentile_result := 0;
  ELSE
    percentile_result := ROUND((total_players - rank_position + 1) * 100.0 / total_players);
  END IF;
  
  RETURN percentile_result;
END;
$$ LANGUAGE plpgsql;

-- 3. 스테나인 계산 함수
CREATE OR REPLACE FUNCTION calculate_stanine(percentile INTEGER) RETURNS INTEGER AS $$
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

-- 4. 메인 리더보드 조회 함수
CREATE OR REPLACE FUNCTION get_leaderboard(
  scope_filter VARCHAR DEFAULT 'global',
  org_id_filter UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 100,
  viewer_user_id UUID DEFAULT NULL
) RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  display_name VARCHAR,
  username VARCHAR,
  org_name VARCHAR,
  total_score INTEGER,
  total_rounds INTEGER,
  best_score INTEGER,
  avg_score INTEGER,
  percentile INTEGER,
  stanine INTEGER,
  is_viewer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH ranked_leaderboard AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY la.total_score DESC, la.avg_score DESC, la.last_updated ASC) as rank,
      la.user_id,
      la.display_name,
      la.username,
      la.org_name,
      la.total_score,
      la.total_rounds,
      la.best_score,
      la.avg_score,
      la.percentile,
      calculate_stanine(la.percentile) as stanine,
      (la.user_id = viewer_user_id) as is_viewer
    FROM leaderboard_aggregated la
    WHERE la.scope = scope_filter
      AND (org_id_filter IS NULL OR la.org_id = org_id_filter)
  ),
  viewer_data AS (
    SELECT 
      rank,
      user_id,
      display_name,
      username,
      org_name,
      total_score,
      total_rounds,
      best_score,
      avg_score,
      percentile,
      stanine,
      is_viewer
    FROM ranked_leaderboard
    WHERE user_id = viewer_user_id
  )
  SELECT * FROM (
    -- Top N 결과
    SELECT * FROM ranked_leaderboard 
    WHERE rank <= limit_count
    
    UNION ALL
    
    -- Viewer가 Top N 밖에 있는 경우 추가
    SELECT * FROM viewer_data
    WHERE user_id = viewer_user_id 
      AND NOT EXISTS (
        SELECT 1 FROM ranked_leaderboard 
        WHERE rank <= limit_count AND user_id = viewer_user_id
      )
  ) combined_results
  ORDER BY rank;
END;
$$ LANGUAGE plpgsql;

-- 5. 성능 최적화를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_leaderboards_scope_period_score 
ON leaderboards(scope, period, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_org_scope_period_score 
ON leaderboards(org_id, scope, period, total_score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_last_updated 
ON leaderboards(last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_users_display_name 
ON users(display_name);

CREATE INDEX IF NOT EXISTS idx_orgs_name 
ON orgs(name);

-- 6. RLS 정책 업데이트 (읽기 전용 공개)
DROP POLICY IF EXISTS "Public read access for leaderboards" ON leaderboards;
CREATE POLICY "Public read access for leaderboards" ON leaderboards
  FOR SELECT USING (true);

-- 7. 함수 실행 권한 설정
GRANT EXECUTE ON FUNCTION get_leaderboard(VARCHAR, UUID, INTEGER, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_percentile(INTEGER, VARCHAR, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stanine(INTEGER) TO anon, authenticated;
GRANT SELECT ON leaderboard_aggregated TO anon, authenticated;
ㅛ