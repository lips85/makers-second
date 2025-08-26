-- Sample data for Word Rush English Word Speed Quiz

-- Insert sample organizations
INSERT INTO orgs (id, name, code, type, description) VALUES
('11111111-1111-1111-1111-111111111111', '서울고등학교', 'SEOUL001', 'school', '서울시 강남구 소재 고등학교'),
('22222222-2222-2222-2222-222222222222', '영어학원 ABC', 'ABC001', 'academy', '전문 영어 교육 학원'),
('33333333-3333-3333-3333-333333333333', '스터디그룹 베타', 'BETA001', 'study_group', '온라인 영어 스터디 그룹')
ON CONFLICT (code) DO NOTHING;

-- Insert sample word items
INSERT INTO word_items (word, meaning, difficulty, category, tags, example_sentence) VALUES
('apple', '사과', 'easy', 'food', ARRAY['fruit', 'basic'], 'I eat an apple every day.'),
('beautiful', '아름다운', 'medium', 'adjective', ARRAY['appearance', 'positive'], 'She is a beautiful person.'),
('computer', '컴퓨터', 'easy', 'technology', ARRAY['device', 'modern'], 'I use my computer for work.'),
('determine', '결정하다', 'hard', 'verb', ARRAY['action', 'decision'], 'We need to determine the best solution.'),
('education', '교육', 'medium', 'noun', ARRAY['learning', 'school'], 'Education is important for everyone.'),
('freedom', '자유', 'medium', 'noun', ARRAY['concept', 'positive'], 'Freedom is a basic human right.'),
('government', '정부', 'hard', 'noun', ARRAY['politics', 'institution'], 'The government makes important decisions.'),
('happiness', '행복', 'medium', 'noun', ARRAY['emotion', 'positive'], 'Happiness comes from within.'),
('important', '중요한', 'medium', 'adjective', ARRAY['value', 'priority'], 'This is an important meeting.'),
('journey', '여행', 'medium', 'noun', ARRAY['travel', 'experience'], 'Life is a journey, not a destination.');

-- Note: Users will be created through Supabase Auth, so we don't insert them here
-- Instead, we'll create a function to handle user creation after auth signup

-- Create function to handle user creation after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (auth_id, email, username, display_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample rounds (these will be created by actual users, but we'll add some for testing)
-- Note: In a real scenario, these would be created by authenticated users

-- Insert sample leaderboard entries (these will be populated by the application logic)
-- Note: In a real scenario, these would be created by the application when rounds are completed

-- Create a function to populate leaderboards from rounds
CREATE OR REPLACE FUNCTION update_user_stats_from_rounds()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user stats
    UPDATE users 
    SET 
        stats = jsonb_build_object(
            'total_rounds', (SELECT COUNT(*) FROM rounds WHERE user_id = NEW.user_id),
            'total_score', (SELECT COALESCE(SUM(total_score), 0) FROM rounds WHERE user_id = NEW.user_id),
            'best_score', (SELECT COALESCE(MAX(total_score), 0) FROM rounds WHERE user_id = NEW.user_id)
        )
    WHERE id = NEW.user_id;
    
    -- Update or insert leaderboard entry
    INSERT INTO leaderboards (user_id, period, scope, subject, total_score, total_rounds, best_score, avg_score)
    SELECT 
        NEW.user_id,
        'all_time'::leaderboard_period,
        'global'::leaderboard_scope,
        'vocabulary'::leaderboard_subject,
        (SELECT COALESCE(SUM(total_score), 0) FROM rounds WHERE user_id = NEW.user_id),
        (SELECT COUNT(*) FROM rounds WHERE user_id = NEW.user_id),
        (SELECT COALESCE(MAX(total_score), 0) FROM rounds WHERE user_id = NEW.user_id),
        (SELECT COALESCE(AVG(total_score), 0) FROM rounds WHERE user_id = NEW.user_id)
    ON CONFLICT (user_id, period, scope, subject) 
    DO UPDATE SET
        total_score = EXCLUDED.total_score,
        total_rounds = EXCLUDED.total_rounds,
        best_score = EXCLUDED.best_score,
        avg_score = EXCLUDED.avg_score,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update stats when rounds are completed
CREATE TRIGGER update_user_stats_on_round_complete
    AFTER UPDATE OF status ON rounds
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
    EXECUTE FUNCTION update_user_stats_from_rounds();
