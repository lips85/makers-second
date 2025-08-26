-- 게스트 사용자 생성 함수에서 role 수정
DROP FUNCTION IF EXISTS public.create_guest_user();

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
    'student', -- guest 대신 student 사용
    true,
    NOW(),
    NOW()
  ) RETURNING id INTO new_user_id;
  
  RETURN guest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
