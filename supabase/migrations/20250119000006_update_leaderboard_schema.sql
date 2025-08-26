-- Update leaderboards table to match API requirements
-- Add new columns for round-specific leaderboards

-- Add new columns to leaderboards table
ALTER TABLE leaderboards 
ADD COLUMN IF NOT EXISTS duration_sec INTEGER,
ADD COLUMN IF NOT EXISTS score INTEGER,
ADD COLUMN IF NOT EXISTS accuracy DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS speed INTEGER,
ADD COLUMN IF NOT EXISTS grade VARCHAR(2),
ADD COLUMN IF NOT EXISTS stanine INTEGER;

-- Create new indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_leaderboards_duration_sec ON leaderboards(duration_sec);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_accuracy ON leaderboards(accuracy DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_speed ON leaderboards(speed ASC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_grade ON leaderboards(grade);
CREATE INDEX IF NOT EXISTS idx_leaderboards_stanine ON leaderboards(stanine);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_leaderboards_period_duration_score 
    ON leaderboards(period, duration_sec, score DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_user_period_duration 
    ON leaderboards(user_id, period, duration_sec);

CREATE INDEX IF NOT EXISTS idx_leaderboards_org_period_duration 
    ON leaderboards(org_id, period, duration_sec);

-- Update unique constraints to include duration_sec
DROP INDEX IF EXISTS unique_user_leaderboard;
CREATE UNIQUE INDEX unique_user_leaderboard 
    ON leaderboards (user_id, period, duration_sec, scope, subject) 
    WHERE user_id IS NOT NULL;

DROP INDEX IF EXISTS unique_org_leaderboard;
CREATE UNIQUE INDEX unique_org_leaderboard 
    ON leaderboards (org_id, period, duration_sec, scope, subject) 
    WHERE org_id IS NOT NULL;

-- Create function to calculate user rank for specific period and duration
CREATE OR REPLACE FUNCTION get_user_rank(
    p_user_id UUID,
    p_period leaderboard_period,
    p_duration_sec INTEGER,
    p_scope leaderboard_scope DEFAULT 'global',
    p_subject leaderboard_subject DEFAULT 'vocabulary'
)
RETURNS TABLE(rank BIGINT, total_players BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH user_score AS (
        SELECT score 
        FROM leaderboards 
        WHERE user_id = p_user_id 
          AND period = p_period 
          AND duration_sec = p_duration_sec
          AND scope = p_scope 
          AND subject = p_subject
    ),
    ranked_players AS (
        SELECT 
            user_id,
            ROW_NUMBER() OVER (ORDER BY score DESC, accuracy DESC, speed ASC) as rank
        FROM leaderboards 
        WHERE period = p_period 
          AND duration_sec = p_duration_sec
          AND scope = p_scope 
          AND subject = p_subject
          AND user_id IS NOT NULL
    ),
    total_count AS (
        SELECT COUNT(*) as total
        FROM leaderboards 
        WHERE period = p_period 
          AND duration_sec = p_duration_sec
          AND scope = p_scope 
          AND subject = p_subject
          AND user_id IS NOT NULL
    )
    SELECT 
        COALESCE(rp.rank, 0) as rank,
        tc.total as total_players
    FROM total_count tc
    LEFT JOIN ranked_players rp ON rp.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get top players for specific period and duration
CREATE OR REPLACE FUNCTION get_top_players(
    p_period leaderboard_period,
    p_duration_sec INTEGER,
    p_limit INTEGER DEFAULT 10,
    p_scope leaderboard_scope DEFAULT 'global',
    p_subject leaderboard_subject DEFAULT 'vocabulary'
)
RETURNS TABLE(
    user_id UUID,
    score INTEGER,
    accuracy DECIMAL(5,2),
    speed INTEGER,
    grade VARCHAR(2),
    percentile DECIMAL(5,2),
    stanine INTEGER,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.user_id,
        l.score,
        l.accuracy,
        l.speed,
        l.grade,
        l.percentile,
        l.stanine,
        ROW_NUMBER() OVER (ORDER BY l.score DESC, l.accuracy DESC, l.speed ASC) as rank
    FROM leaderboards l
    WHERE l.period = p_period 
      AND l.duration_sec = p_duration_sec
      AND l.scope = p_scope 
      AND l.subject = p_subject
      AND l.user_id IS NOT NULL
    ORDER BY l.score DESC, l.accuracy DESC, l.speed ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create function to update leaderboard rankings with new schema
CREATE OR REPLACE FUNCTION update_leaderboard_rankings_v2()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rank_position and percentile for all leaderboards
    WITH ranked_leaderboards AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY period, duration_sec, scope, subject 
                ORDER BY score DESC, accuracy DESC, speed ASC
            ) as new_rank,
            PERCENT_RANK() OVER (
                PARTITION BY period, duration_sec, scope, subject 
                ORDER BY score DESC
            ) * 100 as new_percentile
        FROM leaderboards
        WHERE score IS NOT NULL
    )
    UPDATE leaderboards 
    SET 
        rank_position = rl.new_rank,
        percentile = rl.new_percentile,
        updated_at = NOW()
    FROM ranked_leaderboards rl
    WHERE leaderboards.id = rl.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS update_leaderboard_rankings_trigger ON leaderboards;
CREATE TRIGGER update_leaderboard_rankings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leaderboards
    FOR EACH ROW EXECUTE FUNCTION update_leaderboard_rankings_v2();

-- Create view for top users with new schema
CREATE OR REPLACE VIEW top_users_v2 AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    o.name as org_name,
    l.score,
    l.accuracy,
    l.speed,
    l.grade,
    l.percentile,
    l.stanine,
    l.period,
    l.duration_sec,
    l.scope,
    l.subject,
    l.rank_position
FROM leaderboards l
JOIN users u ON l.user_id = u.id
LEFT JOIN orgs o ON u.org_id = o.id
WHERE l.user_id IS NOT NULL
  AND l.score IS NOT NULL
ORDER BY l.score DESC, l.accuracy DESC, l.speed ASC;

-- Add comments for documentation
COMMENT ON COLUMN leaderboards.duration_sec IS 'Round duration in seconds (60, 75, 90)';
COMMENT ON COLUMN leaderboards.score IS 'Total score for the round';
COMMENT ON COLUMN leaderboards.accuracy IS 'Accuracy percentage (0-100)';
COMMENT ON COLUMN leaderboards.speed IS 'Average response time in milliseconds';
COMMENT ON COLUMN leaderboards.grade IS 'Grade based on performance (S, A, B, C, D, F)';
COMMENT ON COLUMN leaderboards.stanine IS 'Stanine score (1-9)';

COMMENT ON FUNCTION get_user_rank IS 'Get user rank for specific period and duration';
COMMENT ON FUNCTION get_top_players IS 'Get top players for specific period and duration';
