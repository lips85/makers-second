-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types for leaderboard
CREATE TYPE leaderboard_period AS ENUM ('daily', 'weekly', 'monthly', 'all_time');
CREATE TYPE leaderboard_scope AS ENUM ('global', 'school', 'class', 'friends');
CREATE TYPE leaderboard_subject AS ENUM ('vocabulary', 'grammar', 'reading', 'mixed');

-- Create ENUM types for rounds
CREATE TYPE round_duration AS ENUM ('60', '75', '90');
CREATE TYPE round_status AS ENUM ('active', 'completed', 'abandoned');

-- Create ENUM types for word difficulty
CREATE TYPE word_difficulty AS ENUM ('easy', 'medium', 'hard');

-- Create ENUM types for user roles
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Create ENUM types for organization types
CREATE TYPE org_type AS ENUM ('school', 'academy', 'study_group', 'company');

-- Set up updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';
