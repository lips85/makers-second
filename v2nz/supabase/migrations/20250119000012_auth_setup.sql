-- Auth 설정 마이그레이션

-- 1. Auth 스키마에서 사용자 정보를 users 테이블로 동기화하는 함수
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, email, display_name, username, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    'student', -- 기본 역할은 student
    true,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 새 사용자 생성 시 자동으로 users 테이블에 레코드 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. 사용자 삭제 시 users 테이블에서도 삭제
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.users WHERE auth_id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion();

-- 4. 게스트 사용자를 위한 임시 사용자 생성 함수
CREATE OR REPLACE FUNCTION public.create_guest_user()
RETURNS TEXT AS $$
DECLARE
  guest_id TEXT;
BEGIN
  -- 임시 게스트 ID 생성 (UUID 형식으로)
  guest_id := gen_random_uuid()::TEXT;
  
  -- 게스트 사용자 레코드 생성
  INSERT INTO public.users (auth_id, email, display_name, username, role, is_active, created_at, updated_at)
  VALUES (
    guest_id::UUID,
    guest_id || '@guest.local',
    '게스트 사용자',
    'guest_' || substr(md5(random()::text), 1, 6),
    'guest',
    true,
    NOW(),
    NOW()
  );
  
  RETURN guest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 게스트 사용자를 정식 사용자로 업그레이드하는 함수
CREATE OR REPLACE FUNCTION public.upgrade_guest_to_user(guest_auth_id TEXT, new_auth_id TEXT, new_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 게스트 사용자의 데이터를 새 사용자로 이전
  UPDATE public.users 
  SET 
    auth_id = new_auth_id,
    email = new_email,
    display_name = COALESCE(display_name, split_part(new_email, '@', 1)),
    username = COALESCE(username, split_part(new_email, '@', 1)),
    role = 'student',
    updated_at = NOW()
  WHERE auth_id = guest_auth_id;
  
  -- 라운드 데이터도 이전
  UPDATE public.rounds 
  SET user_id = (SELECT id FROM public.users WHERE auth_id = new_auth_id)
  WHERE user_id = (SELECT id FROM public.users WHERE auth_id = guest_auth_id);
  
  -- 리더보드 데이터도 이전
  UPDATE public.leaderboards 
  SET user_id = (SELECT id FROM public.users WHERE auth_id = new_auth_id)
  WHERE user_id = (SELECT id FROM public.users WHERE auth_id = guest_auth_id);
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS 정책 개선 - 게스트 사용자도 기본적인 읽기 권한 허용
CREATE POLICY "Guest users can read public data" ON word_items
  FOR SELECT USING (true);

CREATE POLICY "Guest users can read orgs" ON orgs
  FOR SELECT USING (true);

-- 7. 게스트 사용자용 임시 세션 관리
CREATE TABLE IF NOT EXISTS public.guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_auth_id TEXT NOT NULL,
  session_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX idx_guest_sessions_guest_auth_id ON public.guest_sessions (guest_auth_id);
CREATE INDEX idx_guest_sessions_expires_at ON public.guest_sessions (expires_at);

-- 게스트 세션 RLS 정책
ALTER TABLE public.guest_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Guest sessions are accessible by guest auth id" ON public.guest_sessions
  FOR ALL USING (guest_auth_id = current_setting('app.guest_auth_id', true)::TEXT);

-- 만료된 게스트 세션 정리 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_guest_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.guest_sessions 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
