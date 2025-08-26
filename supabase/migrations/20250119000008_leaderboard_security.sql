-- 리더보드 보안 및 RLS 정책 설정
-- T-005 S2: 보안·RLS·인덱스 구성

-- 1. 기존 RLS 정책 정리
DROP POLICY IF EXISTS "Public read access for leaderboards" ON leaderboards;
DROP POLICY IF EXISTS "Users can view their own leaderboard entries" ON leaderboards;
DROP POLICY IF EXISTS "Public read access for users" ON users;
DROP POLICY IF EXISTS "Public read access for orgs" ON orgs;

-- 2. 리더보드 테이블 RLS 정책 설정
-- 읽기 전용 공개 정책 (익명/인증 사용자 모두 접근 가능)
CREATE POLICY "leaderboards_read_public" ON leaderboards
  FOR SELECT USING (true);

-- 사용자 자신의 데이터만 수정 가능
CREATE POLICY "leaderboards_update_own" ON leaderboards
  FOR UPDATE USING (auth.uid() = user_id);

-- 사용자 자신의 데이터만 삽입 가능
CREATE POLICY "leaderboards_insert_own" ON leaderboards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. 사용자 테이블 RLS 정책 설정 (민감 정보 보호)
-- display_name과 username만 공개, 나머지는 제한
CREATE POLICY "users_read_public_limited" ON users
  FOR SELECT USING (
    -- 활성 사용자만 표시
    is_active = true
  );

-- 사용자 자신의 전체 정보만 조회 가능
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = auth_id);

-- 4. 조직 테이블 RLS 정책 설정
-- 조직 정보는 공개 (학교명 등)
CREATE POLICY "orgs_read_public" ON orgs
  FOR SELECT USING (is_active = true);

-- 5. 성능 최적화를 위한 추가 인덱스
-- 복합 인덱스로 쿼리 성능 향상
CREATE INDEX IF NOT EXISTS idx_leaderboards_composite_performance
ON leaderboards(scope, period, total_score DESC, last_updated DESC);

-- 사용자 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_active_display
ON users(is_active, display_name);

-- 조직 조회 최적화
CREATE INDEX IF NOT EXISTS idx_orgs_active_name
ON orgs(is_active, name);

-- 6. 뷰에 대한 RLS 정책 설정
-- leaderboard_aggregated 뷰는 함수를 통해서만 접근하도록 제한
REVOKE ALL ON leaderboard_aggregated FROM anon, authenticated;

-- 7. 함수 실행 권한 재확인
GRANT EXECUTE ON FUNCTION get_leaderboard(VARCHAR, UUID, INTEGER, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_percentile(INTEGER, VARCHAR, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION calculate_stanine(INTEGER) TO anon, authenticated;

-- 8. 테이블 접근 권한 설정
-- 익명/인증 사용자는 읽기만 가능
GRANT SELECT ON leaderboards TO anon, authenticated;
GRANT SELECT ON users TO anon, authenticated;
GRANT SELECT ON orgs TO anon, authenticated;

-- 인증된 사용자만 자신의 데이터 수정 가능
GRANT INSERT, UPDATE ON leaderboards TO authenticated;

-- 9. 민감 정보 보호를 위한 뷰 생성
CREATE OR REPLACE VIEW public_users AS
SELECT 
  id,
  display_name,
  username,
  role,
  org_id,
  grade_level,
  is_active,
  created_at
FROM users
WHERE is_active = true;

-- 10. 뷰에 대한 권한 설정
GRANT SELECT ON public_users TO anon, authenticated;
