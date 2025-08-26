-- 테스트 조직 데이터 추가
INSERT INTO orgs (id, code, name, type, description, settings, created_at, updated_at) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'SEOUL_HIGH', '서울고등학교', 'school', '서울시 강남구 소재 고등학교', '{"ads_enabled": true}', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'BUSAN_MIDDLE', '부산중학교', 'school', '부산시 해운대구 소재 중학교', '{"ads_enabled": true}', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'DAEGU_ELEMENTARY', '대구초등학교', 'school', '대구시 수성구 소재 초등학교', '{"ads_enabled": true}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 테스트 사용자 데이터 추가 (auth.users는 실제 인증 시스템에서 생성되어야 함)
-- 여기서는 임시로 orgs 테이블만 업데이트
