-- Enable RLS on all tables
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- Organizations (orgs) - Public read, authenticated write
CREATE POLICY "Organizations are viewable by everyone" ON orgs
    FOR SELECT USING (true);

CREATE POLICY "Organizations can be created by authenticated users" ON orgs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Organizations can be updated by owners" ON orgs
    FOR UPDATE USING (auth.uid() IN (
        SELECT u.auth_id FROM users u 
        WHERE u.org_id = orgs.id AND u.role = 'teacher'
    ));

-- Users (users) - Users can only access their own data
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = auth_id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = auth_id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = auth_id);

-- Allow teachers to view students in their organization
CREATE POLICY "Teachers can view students in their org" ON users
    FOR SELECT USING (
        auth.uid() IN (
            SELECT u.auth_id FROM users u 
            WHERE u.org_id = users.org_id AND u.role = 'teacher'
        )
    );

-- Word items (word_items) - Public read, authenticated write
CREATE POLICY "Word items are viewable by everyone" ON word_items
    FOR SELECT USING (true);

CREATE POLICY "Word items can be created by authenticated users" ON word_items
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Word items can be updated by creators" ON word_items
    FOR UPDATE USING (auth.uid() IN (
        SELECT u.auth_id FROM users u WHERE u.id = word_items.created_by
    ));

-- Rounds (rounds) - Users can only access their own rounds
CREATE POLICY "Users can view their own rounds" ON rounds
    FOR SELECT USING (auth.uid() IN (
        SELECT u.auth_id FROM users u WHERE u.id = rounds.user_id
    ));

CREATE POLICY "Users can create their own rounds" ON rounds
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT u.auth_id FROM users u WHERE u.id = rounds.user_id
    ));

CREATE POLICY "Users can update their own rounds" ON rounds
    FOR UPDATE USING (auth.uid() IN (
        SELECT u.auth_id FROM users u WHERE u.id = rounds.user_id
    ));

-- Allow teachers to view rounds in their organization
CREATE POLICY "Teachers can view rounds in their org" ON rounds
    FOR SELECT USING (
        auth.uid() IN (
            SELECT u.auth_id FROM users u 
            WHERE u.org_id = rounds.org_id AND u.role = 'teacher'
        )
    );

-- Round items (round_items) - Users can only access their own round items
CREATE POLICY "Users can view their own round items" ON round_items
    FOR SELECT USING (auth.uid() IN (
        SELECT u.auth_id FROM users u 
        JOIN rounds r ON u.id = r.user_id 
        WHERE r.id = round_items.round_id
    ));

CREATE POLICY "Users can create their own round items" ON round_items
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT u.auth_id FROM users u 
        JOIN rounds r ON u.id = r.user_id 
        WHERE r.id = round_items.round_id
    ));

CREATE POLICY "Users can update their own round items" ON round_items
    FOR UPDATE USING (auth.uid() IN (
        SELECT u.auth_id FROM users u 
        JOIN rounds r ON u.id = r.user_id 
        WHERE r.id = round_items.round_id
    ));

-- Allow teachers to view round items in their organization
CREATE POLICY "Teachers can view round items in their org" ON round_items
    FOR SELECT USING (
        auth.uid() IN (
            SELECT u.auth_id FROM users u 
            JOIN rounds r ON u.id = r.user_id 
            WHERE u.org_id = r.org_id AND u.role = 'teacher'
        )
    );

-- Leaderboards (leaderboards) - Public read, authenticated write
CREATE POLICY "Leaderboards are viewable by everyone" ON leaderboards
    FOR SELECT USING (true);

CREATE POLICY "Users can create their own leaderboard entries" ON leaderboards
    FOR INSERT WITH CHECK (
        (user_id IS NOT NULL AND auth.uid() IN (
            SELECT u.auth_id FROM users u WHERE u.id = leaderboards.user_id
        )) OR
        (org_id IS NOT NULL AND auth.uid() IN (
            SELECT u.auth_id FROM users u 
            WHERE u.org_id = leaderboards.org_id AND u.role = 'teacher'
        ))
    );

CREATE POLICY "Users can update their own leaderboard entries" ON leaderboards
    FOR UPDATE USING (
        (user_id IS NOT NULL AND auth.uid() IN (
            SELECT u.auth_id FROM users u WHERE u.id = leaderboards.user_id
        )) OR
        (org_id IS NOT NULL AND auth.uid() IN (
            SELECT u.auth_id FROM users u 
            WHERE u.org_id = leaderboards.org_id AND u.role = 'teacher'
        ))
    );

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant necessary permissions to anon users (for public read access)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON orgs TO anon;
GRANT SELECT ON word_items TO anon;
GRANT SELECT ON leaderboards TO anon;
GRANT SELECT ON top_users TO anon;
GRANT SELECT ON top_organizations TO anon;
