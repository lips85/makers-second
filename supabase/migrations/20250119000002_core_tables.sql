-- Create organizations table
CREATE TABLE IF NOT EXISTS orgs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    type org_type NOT NULL DEFAULT 'school',
    description TEXT,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    org_id UUID REFERENCES orgs(id) ON DELETE SET NULL,
    grade_level INTEGER CHECK (grade_level >= 1 AND grade_level <= 12),
    settings JSONB DEFAULT '{}',
    stats JSONB DEFAULT '{"total_rounds": 0, "total_score": 0, "best_score": 0}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create word_items table
CREATE TABLE IF NOT EXISTS word_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word VARCHAR(100) NOT NULL,
    meaning TEXT NOT NULL,
    difficulty word_difficulty DEFAULT 'medium',
    category VARCHAR(100),
    tags TEXT[],
    example_sentence TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    is_approved BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orgs_code ON orgs(code);
CREATE INDEX IF NOT EXISTS idx_orgs_type ON orgs(type);
CREATE INDEX IF NOT EXISTS idx_orgs_active ON orgs(is_active);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_word_items_word ON word_items(word);
CREATE INDEX IF NOT EXISTS idx_word_items_difficulty ON word_items(difficulty);
CREATE INDEX IF NOT EXISTS idx_word_items_category ON word_items(category);
CREATE INDEX IF NOT EXISTS idx_word_items_approved ON word_items(is_approved);
CREATE INDEX IF NOT EXISTS idx_word_items_usage ON word_items(usage_count);

-- Create unique constraints
CREATE UNIQUE INDEX unique_email_per_org 
    ON users (email, org_id) WHERE org_id IS NOT NULL;

-- Create updated_at triggers
CREATE TRIGGER update_orgs_updated_at 
    BEFORE UPDATE ON orgs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_word_items_updated_at 
    BEFORE UPDATE ON word_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
