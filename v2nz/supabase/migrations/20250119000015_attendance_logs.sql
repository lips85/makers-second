-- 출석 체크 로그 테이블 생성
CREATE TABLE IF NOT EXISTS public.attendance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attend_date DATE NOT NULL,
  streak_before INTEGER NOT NULL DEFAULT 0,
  streak_after INTEGER NOT NULL DEFAULT 1,
  reward_points INTEGER NOT NULL DEFAULT 10,
  total_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON public.attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_attend_date ON public.attendance_logs(attend_date);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_date ON public.attendance_logs(user_id, attend_date);

-- 유니크 제약 조건 (일자당 중복 체크인 방지)
ALTER TABLE public.attendance_logs 
ADD CONSTRAINT unique_user_attend_date UNIQUE (user_id, attend_date);

-- RLS 정책 활성화
ALTER TABLE public.attendance_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
-- 본인 데이터만 조회 가능
CREATE POLICY "users_can_view_own_attendance" ON public.attendance_logs
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- 본인 데이터만 삽입 가능
CREATE POLICY "users_can_insert_own_attendance" ON public.attendance_logs
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 본인 데이터만 업데이트 가능
CREATE POLICY "users_can_update_own_attendance" ON public.attendance_logs
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 본인 데이터만 삭제 가능
CREATE POLICY "users_can_delete_own_attendance" ON public.attendance_logs
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_attendance_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 업데이트 트리거 생성
CREATE TRIGGER trigger_update_attendance_logs_updated_at
  BEFORE UPDATE ON public.attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_logs_updated_at();

-- 출석 체크 함수 생성
CREATE OR REPLACE FUNCTION check_attendance(
  p_user_id UUID,
  p_attend_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
  is_new BOOLEAN,
  attend_date DATE,
  streak_before INTEGER,
  streak_after INTEGER,
  reward_points INTEGER,
  total_points INTEGER
) AS $$
DECLARE
  v_existing_record attendance_logs%ROWTYPE;
  v_previous_streak INTEGER := 0;
  v_new_streak INTEGER := 1;
  v_reward_points INTEGER := 10;
  v_total_points INTEGER := 0;
BEGIN
  -- 기존 출석 기록 확인
  SELECT * INTO v_existing_record
  FROM attendance_logs
  WHERE user_id = p_user_id AND attend_date = p_attend_date;
  
  -- 이미 출석한 경우 기존 데이터 반환
  IF FOUND THEN
    RETURN QUERY SELECT
      FALSE as is_new,
      v_existing_record.attend_date,
      v_existing_record.streak_before,
      v_existing_record.streak_after,
      v_existing_record.reward_points,
      v_existing_record.total_points;
    RETURN;
  END IF;
  
  -- 이전 연속 출석 확인
  SELECT COALESCE(streak_after, 0) INTO v_previous_streak
  FROM attendance_logs
  WHERE user_id = p_user_id AND attend_date = p_attend_date - INTERVAL '1 day'
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- 연속 출석 계산
  IF v_previous_streak > 0 THEN
    v_new_streak := v_previous_streak + 1;
  END IF;
  
  -- 보상 포인트 계산 (연속 출석에 따른 보너스)
  v_reward_points := 10 + (v_new_streak - 1) * 2; -- 기본 10점 + 연속일수 * 2점
  
  -- 총 포인트 계산 (기존 포인트 + 새로운 보상)
  SELECT COALESCE(SUM(reward_points), 0) INTO v_total_points
  FROM attendance_logs
  WHERE user_id = p_user_id;
  v_total_points := v_total_points + v_reward_points;
  
  -- 새로운 출석 기록 삽입
  INSERT INTO attendance_logs (
    user_id,
    attend_date,
    streak_before,
    streak_after,
    reward_points,
    total_points
  ) VALUES (
    p_user_id,
    p_attend_date,
    v_previous_streak,
    v_new_streak,
    v_reward_points,
    v_total_points
  );
  
  -- 결과 반환
  RETURN QUERY SELECT
    TRUE as is_new,
    p_attend_date as attend_date,
    v_previous_streak as streak_before,
    v_new_streak as streak_after,
    v_reward_points as reward_points,
    v_total_points as total_points;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 사용자별 출석 통계 뷰 생성
CREATE OR REPLACE VIEW public.user_attendance_stats AS
SELECT 
  user_id,
  COUNT(*) as total_attendance_days,
  MAX(streak_after) as max_streak,
  SUM(reward_points) as total_reward_points,
  MAX(attend_date) as last_attendance_date
FROM public.attendance_logs
GROUP BY user_id;

-- 출석 통계 뷰에 대한 RLS 정책
CREATE POLICY "users_can_view_own_attendance_stats" ON public.user_attendance_stats
  FOR SELECT USING (auth.uid()::text = user_id::text);
