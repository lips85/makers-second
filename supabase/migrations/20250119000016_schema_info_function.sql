-- 스키마 정보 조회용 RPC 함수 생성 (CI/CD 용)
CREATE OR REPLACE FUNCTION get_schema_info()
RETURNS TABLE(
  table_name text,
  column_name text,
  data_type text,
  is_nullable text,
  column_default text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    c.column_name::text,
    c.data_type::text,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.tables t
  JOIN information_schema.columns c ON t.table_name = c.table_name
  WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'auth_%'
  AND t.table_name NOT LIKE 'storage_%'
  AND t.table_name NOT LIKE 'realtime_%'
  ORDER BY t.table_name, c.ordinal_position;
END;
$$;

-- 테이블 목록만 가져오는 간단한 함수
CREATE OR REPLACE FUNCTION get_table_list()
RETURNS TABLE(table_name text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  AND t.table_name NOT LIKE 'auth_%'
  AND t.table_name NOT LIKE 'storage_%'
  AND t.table_name NOT LIKE 'realtime_%'
  ORDER BY t.table_name;
END;
$$;

-- 익명 사용자도 이 함수를 호출할 수 있도록 권한 부여 (CI/CD용)
GRANT EXECUTE ON FUNCTION get_schema_info() TO anon;
GRANT EXECUTE ON FUNCTION get_table_list() TO anon;

-- 보안: 스키마 정보는 읽기 전용이므로 안전함
COMMENT ON FUNCTION get_schema_info() IS 'CI/CD용 스키마 정보 조회 함수 - 읽기 전용';
COMMENT ON FUNCTION get_table_list() IS 'CI/CD용 테이블 목록 조회 함수 - 읽기 전용';
