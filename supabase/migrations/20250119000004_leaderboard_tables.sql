-- Create leaderboards table
CREATE TABLE IF NOT EXISTS leaderboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE CASCADE,
    period leaderboard_period NOT NULL DEFAULT 'all_time',
    scope leaderboard_scope NOT NULL DEFAULT 'global',
    subject leaderboard_subject NOT NULL DEFAULT 'vocabulary',
    total_score INTEGER DEFAULT 0,
    total_rounds INTEGER DEFAULT 0,
    best_score INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0,
    rank_position INTEGER,
    percentile DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either user_id or org_id is set, but not both
    CONSTRAINT check_user_or_org CHECK (
        (user_id IS NOT NULL AND org_id IS NULL) OR 
        (user_id IS NULL AND org_id IS NOT NULL)
    )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_id ON leaderboards(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_org_id ON leaderboards(org_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_period ON leaderboards(period);
CREATE INDEX IF NOT EXISTS idx_leaderboards_scope ON leaderboards(scope);
CREATE INDEX IF NOT EXISTS idx_leaderboards_subject ON leaderboards(subject);
CREATE INDEX IF NOT EXISTS idx_leaderboards_score ON leaderboards(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboards_rank ON leaderboards(rank_position);

-- Create unique constraints for user and org leaderboards
CREATE UNIQUE INDEX unique_user_leaderboard 
    ON leaderboards (user_id, period, scope, subject) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX unique_org_leaderboard 
    ON leaderboards (org_id, period, scope, subject) 
    WHERE org_id IS NOT NULL;

-- Create view for top users
CREATE OR REPLACE VIEW top_users AS
SELECT 
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    o.name as org_name,
    l.total_score,
    l.total_rounds,
    l.best_score,
    l.avg_score,
    l.rank_position,
    l.percentile,
    l.period,
    l.scope,
    l.subject
FROM leaderboards l
JOIN users u ON l.user_id = u.id
LEFT JOIN orgs o ON u.org_id = o.id
WHERE l.user_id IS NOT NULL
ORDER BY l.total_score DESC, l.rank_position ASC;

-- Create view for top organizations
CREATE OR REPLACE VIEW top_organizations AS
SELECT 
    o.id,
    o.name,
    o.code,
    o.type,
    l.total_score,
    l.total_rounds,
    l.best_score,
    l.avg_score,
    l.rank_position,
    l.percentile,
    l.period,
    l.scope,
    l.subject
FROM leaderboards l
JOIN orgs o ON l.org_id = o.id
WHERE l.org_id IS NOT NULL
ORDER BY l.total_score DESC, l.rank_position ASC;

-- Create function to update leaderboard rankings
CREATE OR REPLACE FUNCTION update_leaderboard_rankings()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rank_position and percentile for all leaderboards
    WITH ranked_leaderboards AS (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY period, scope, subject 
                ORDER BY total_score DESC, updated_at ASC
            ) as new_rank,
            PERCENT_RANK() OVER (
                PARTITION BY period, scope, subject 
                ORDER BY total_score DESC
            ) * 100 as new_percentile
        FROM leaderboards
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

-- Create trigger to update rankings when leaderboards are modified
CREATE TRIGGER update_leaderboard_rankings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON leaderboards
    FOR EACH ROW EXECUTE FUNCTION update_leaderboard_rankings();

-- Create updated_at trigger for leaderboards
CREATE TRIGGER update_leaderboards_updated_at 
    BEFORE UPDATE ON leaderboards 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
