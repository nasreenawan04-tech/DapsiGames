-- Row Level Security (RLS) Policies for DapsiGames
-- These policies ensure users can only access and modify their own data

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievement_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read all users (for leaderboard functionality)
CREATE POLICY "Users can read all users" ON users
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

-- User Stats table policies
-- Anyone can read stats (for leaderboard)
CREATE POLICY "Anyone can read user stats" ON user_stats
  FOR SELECT USING (true);

-- Users can update their own stats
CREATE POLICY "Users can update own stats" ON user_stats
  FOR UPDATE USING (auth.uid()::text = user_id);

-- System can insert stats (done during user creation)
CREATE POLICY "System can insert user stats" ON user_stats
  FOR INSERT WITH CHECK (true);

-- Achievement Definitions table policies
-- Anyone can read achievement definitions
CREATE POLICY "Anyone can read achievement definitions" ON achievement_definitions
  FOR SELECT USING (true);

-- User Achievements table policies
-- Users can read all achievements (to see what others have earned)
CREATE POLICY "Users can read all achievements" ON user_achievements
  FOR SELECT USING (true);

-- Users can insert their own achievements
CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Games table policies
-- Anyone can read games
CREATE POLICY "Anyone can read games" ON games
  FOR SELECT USING (true);

-- Study Materials table policies
-- Anyone can read study materials
CREATE POLICY "Anyone can read study materials" ON study_materials
  FOR SELECT USING (true);

-- User Activities table policies
-- Users can read all activities (for activity feed)
CREATE POLICY "Users can read all activities" ON user_activities
  FOR SELECT USING (true);

-- Users can insert their own activities
CREATE POLICY "Users can insert own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Game Scores table policies
-- Anyone can read scores (for leaderboards)
CREATE POLICY "Anyone can read game scores" ON game_scores
  FOR SELECT USING (true);

-- Users can insert their own scores
CREATE POLICY "Users can insert own scores" ON game_scores
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Bookmarks table policies
-- Users can read their own bookmarks
CREATE POLICY "Users can read own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own bookmarks
CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid()::text = user_id);

-- User Progress table policies
-- Users can read their own progress
CREATE POLICY "Users can read own progress" ON user_progress
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can insert their own progress
CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE USING (auth.uid()::text = user_id);
