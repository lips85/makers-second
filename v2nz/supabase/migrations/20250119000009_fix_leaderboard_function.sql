-- 리더보드 함수 문제 해결
-- T-005: 함수 매개변수 및 권한 문제 수정

-- 1. 기존 함수 삭제
DROP FUNCTION IF EXISTS get_leaderboard(VARCHAR, UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS calculate_percentile(INTEGER, VARCHAR, UUID);
DROP FUNCTION IF EXISTS calculate_stanine(INTEGER);

-- 2. 뷰 재생성
DROP VIEW IF EXISTS leaderboard_aggregated;
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

-- 3. 스테나인 계산 함수 (단순화)
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

-- 4. 메인 리더보드 조회 함수 (단순화)
CREATE OR REPLACE FUNCTION get_leaderboard(
  scope_filter TEXT DEFAULT 'global',
  org_id_filter TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 100,
  viewer_user_id TEXT DEFAULT NULL
) RETURNS TABLE (
  rank INTEGER,
  user_id TEXT,
  display_name TEXT,
  username TEXT,
  org_name TEXT,
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
      la.user_id::TEXT,
      la.display_name,
      la.username,
      la.org_name,
      la.total_score,
      la.total_rounds,
      la.best_score,
      la.avg_score,
      la.percentile,
      calculate_stanine(la.percentile) as stanine,
      (la.user_id::TEXT = viewer_user_id) as is_viewer
    FROM leaderboard_aggregated la
    WHERE la.scope = scope_filter
      AND (org_id_filter IS NULL OR la.org_id::TEXT = org_id_filter)
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

-- 5. 권한 설정
GRANT EXECUTE ON FUNCTION get_leaderboard(TEXT, TEXT, INTEGER, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stanine(INTEGER) TO anon, authenticated;
GRANT SELECT ON leaderboard_aggregated TO anon, authenticated;

-- 6. 테스트 데이터는 나중에 별도로 삽입
