-- Create rounds table
CREATE TABLE IF NOT EXISTS rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
    duration_sec INTEGER NOT NULL CHECK (duration_sec IN (60, 75, 90)),
    status round_status DEFAULT 'active',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create round_items table
CREATE TABLE IF NOT EXISTS round_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
    word_item_id UUID NOT NULL REFERENCES word_items(id) ON DELETE RESTRICT,
    question_order INTEGER NOT NULL,
    user_answer TEXT,
    is_correct BOOLEAN,
    response_time_ms INTEGER CHECK (response_time_ms >= 0 AND response_time_ms <= 30000),
    score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rounds_user_id ON rounds(user_id);
CREATE INDEX IF NOT EXISTS idx_rounds_org_id ON rounds(org_id);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_start_time ON rounds(start_time);
CREATE INDEX IF NOT EXISTS idx_rounds_score ON rounds(total_score DESC);

CREATE INDEX IF NOT EXISTS idx_round_items_round_id ON round_items(round_id);
CREATE INDEX IF NOT EXISTS idx_round_items_word_item_id ON round_items(word_item_id);
CREATE INDEX IF NOT EXISTS idx_round_items_order ON round_items(round_id, question_order);

-- Create unique constraint for question order within a round
CREATE UNIQUE INDEX unique_round_item_order 
    ON round_items (round_id, question_order);

-- Create function to update round statistics when round_items are inserted/updated
CREATE OR REPLACE FUNCTION update_round_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update rounds table with aggregated statistics
    UPDATE rounds 
    SET 
        total_questions = (
            SELECT COUNT(*) 
            FROM round_items 
            WHERE round_id = COALESCE(NEW.round_id, OLD.round_id)
        ),
        correct_answers = (
            SELECT COUNT(*) 
            FROM round_items 
            WHERE round_id = COALESCE(NEW.round_id, OLD.round_id) 
            AND is_correct = true
        ),
        total_score = (
            SELECT COALESCE(SUM(score), 0) 
            FROM round_items 
            WHERE round_id = COALESCE(NEW.round_id, OLD.round_id)
        ),
        avg_response_time_ms = (
            SELECT COALESCE(AVG(response_time_ms), 0) 
            FROM round_items 
            WHERE round_id = COALESCE(NEW.round_id, OLD.round_id)
            AND response_time_ms IS NOT NULL
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.round_id, OLD.round_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for round_items
CREATE TRIGGER update_round_stats_on_insert
    AFTER INSERT ON round_items
    FOR EACH ROW EXECUTE FUNCTION update_round_stats();

CREATE TRIGGER update_round_stats_on_update
    AFTER UPDATE ON round_items
    FOR EACH ROW EXECUTE FUNCTION update_round_stats();

CREATE TRIGGER update_round_stats_on_delete
    AFTER DELETE ON round_items
    FOR EACH ROW EXECUTE FUNCTION update_round_stats();

-- Create updated_at trigger for rounds
CREATE TRIGGER update_rounds_updated_at 
    BEFORE UPDATE ON rounds 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
