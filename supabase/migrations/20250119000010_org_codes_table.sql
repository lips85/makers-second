-- org_codes 테이블 생성 (교실 코드 관리)
CREATE TABLE org_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- TTL 제약조건: 만료 시각이 현재 시각보다 미래여야 함
    CONSTRAINT org_codes_expires_at_future CHECK (expires_at > NOW()),
    
    -- 코드는 6자리 대문자와 숫자만 허용
    CONSTRAINT org_codes_code_format CHECK (code ~ '^[A-Z0-9]{6}$')
);

-- 인덱스 생성
CREATE INDEX idx_org_codes_code ON org_codes(code);
CREATE INDEX idx_org_codes_org_id ON org_codes(org_id);
CREATE INDEX idx_org_codes_expires_at ON org_codes(expires_at);
CREATE INDEX idx_org_codes_active_expires ON org_codes(is_active, expires_at) WHERE is_active = true;

-- RLS 정책 활성화
ALTER TABLE org_codes ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 코드 조회는 모든 사용자 허용 (코드 참여용)
CREATE POLICY "org_codes_read_public" ON org_codes
    FOR SELECT USING (
        is_active = true 
        AND expires_at > NOW()
    );

-- RLS 정책: 코드 생성은 인증된 사용자만 허용
CREATE POLICY "org_codes_insert_authenticated" ON org_codes
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL 
        AND created_by = auth.uid()
    );

-- RLS 정책: 코드 비활성화는 본인만 허용
CREATE POLICY "org_codes_update_own" ON org_codes
    FOR UPDATE USING (
        auth.uid() = created_by
    ) WITH CHECK (
        auth.uid() = created_by
    );

-- RLS 정책: 코드 삭제는 본인만 허용
CREATE POLICY "org_codes_delete_own" ON org_codes
    FOR DELETE USING (
        auth.uid() = created_by
    );

-- 함수: 만료된 코드 정리 (cron job용)
CREATE OR REPLACE FUNCTION cleanup_expired_org_codes()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    UPDATE org_codes 
    SET is_active = false 
    WHERE is_active = true 
    AND expires_at <= NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 함수: 코드 유효성 검증
CREATE OR REPLACE FUNCTION validate_org_code(code_input TEXT)
RETURNS TABLE (
    is_valid BOOLEAN,
    org_id UUID,
    expires_at TIMESTAMPTZ,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN oc.id IS NULL THEN false
            WHEN oc.expires_at <= NOW() THEN false
            WHEN NOT oc.is_active THEN false
            ELSE true
        END as is_valid,
        oc.org_id,
        oc.expires_at,
        CASE 
            WHEN oc.id IS NULL THEN 'Invalid code'
            WHEN oc.expires_at <= NOW() THEN 'Code has expired'
            WHEN NOT oc.is_active THEN 'Code is inactive'
            ELSE NULL
        END as error_message
    FROM org_codes oc
    WHERE oc.code = UPPER(code_input)
    LIMIT 1;
    
    -- 코드가 존재하지 않는 경우
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT false, NULL::UUID, NULL::TIMESTAMPTZ, 'Code not found'::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 댓글 추가
COMMENT ON TABLE org_codes IS '교실 코드 관리 테이블 - 교사가 생성한 임시 코드로 학생들이 조직에 참여';
COMMENT ON COLUMN org_codes.code IS '6자리 대문자/숫자 조합의 교실 코드';
COMMENT ON COLUMN org_codes.expires_at IS '코드 만료 시각 (TTL)';
COMMENT ON FUNCTION cleanup_expired_org_codes() IS '만료된 코드를 비활성화하는 정리 함수';
COMMENT ON FUNCTION validate_org_code(TEXT) IS '코드 유효성을 검증하고 조직 정보를 반환하는 함수';
