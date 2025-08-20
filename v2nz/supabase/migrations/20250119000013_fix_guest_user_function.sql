-- 게스트 사용자 생성 함수 수정
-- 게스트 사용자는 auth_id 없이 생성 (로컬에서만 관리)

-- 기존 함수 삭제
DROP FUNCTION IF EXISTS public.create_guest_user();

-- 새로운 게스트 사용자 생성 함수
CREATE OR REPLACE FUNCTION public.create_guest_user()
RETURNS TEXT AS $$
DECLARE
  guest_id TEXT;
  new_user_id UUID;
BEGIN
  -- 임시 게스트 ID 생성
  guest_id := 'guest_' || substr(md5(random()::text), 1, 8) || '_' || extract(epoch from now())::bigint;
  
  -- 게스트 사용자 레코드 생성 (auth_id는 NULL로 설정)
  INSERT INTO public.users (auth_id, email, display_name, username, role, is_active, created_at, updated_at)
  VALUES (
    NULL, -- auth_id는 NULL (게스트는 실제 Auth 사용자가 아님)
    guest_id || '@guest.local',
    '게스트 사용자',
    'guest_' || substr(md5(random()::text), 1, 6),
    'student',
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;
  
  RETURN guest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 게스트 사용자 업그레이드 함수도 수정
CREATE OR REPLACE FUNCTION public.upgrade_guest_to_user(guest_auth_id TEXT, new_auth_id TEXT, new_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- 게스트 사용자의 데이터를 새 사용자로 이전
  UPDATE public.users 
  SET 
    auth_id = new_auth_id::UUID,
    email = new_email,
    display_name = COALESCE(display_name, split_part(new_email, '@', 1)),
    username = COALESCE(username, split_part(new_email, '@', 1)),
    role = 'student',
    updated_at = NOW()
  WHERE auth_id IS NULL AND email LIKE 'guest_%@guest.local';
  
  -- 라운드 데이터도 이전 (게스트 사용자의 라운드를 새 사용자로)
  UPDATE public.rounds 
  SET user_id = (SELECT id FROM public.users WHERE auth_id = new_auth_id::UUID)
  WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE auth_id IS NULL AND email LIKE 'guest_%@guest.local'
  );
  
  -- 리더보드 데이터도 이전
  UPDATE public.leaderboards 
  SET user_id = (SELECT id FROM public.users WHERE auth_id = new_auth_id::UUID)
  WHERE user_id IN (
    SELECT id FROM public.users 
    WHERE auth_id IS NULL AND email LIKE 'guest_%@guest.local'
  );
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
