-- Seed Data for DapsiGames
-- This migration inserts sample data for testing and initial launch

-- Insert Achievement Definitions
INSERT INTO achievement_definitions (name, description, badge_icon, points_required, category) VALUES
  ('First Steps', 'Complete your first activity', '🌟', 10, 'beginner'),
  ('Point Collector', 'Earn 100 points', '💎', 100, 'points'),
  ('Century Club', 'Earn 500 points', '🏆', 500, 'points'),
  ('Elite Scholar', 'Earn 1000 points', '👑', 1000, 'points'),
  ('Study Streak', 'Complete 5 study sessions', '📚', 50, 'study'),
  ('Bookworm', 'Complete 20 study sessions', '📖', 200, 'study'),
  ('Game Master', 'Play 10 different games', '🎮', 100, 'gaming'),
  ('Perfect Score', 'Achieve a perfect score in any game', '⭐', 150, 'gaming'),
  ('Early Bird', 'Be among the first 100 users', '🐦', 50, 'special'),
  ('Top 10', 'Reach top 10 on the leaderboard', '🥇', 500, 'leaderboard')
ON CONFLICT DO NOTHING;

-- Insert Sample Games
INSERT INTO games (title, description, difficulty, points_reward, category, thumbnail_url, instructions) VALUES
  (
    'Math Blitz',
    'Test your arithmetic skills with rapid-fire math problems. Answer as many as you can before time runs out!',
    'Easy',
    10,
    'Mathematics',
    'https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=400',
    'Solve math problems as quickly as possible. Each correct answer earns you points. You have 60 seconds!'
  ),
  (
    'Word Scramble',
    'Unscramble letters to form valid words. Perfect for improving vocabulary and spelling.',
    'Easy',
    15,
    'Language Arts',
    'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400',
    'Rearrange the scrambled letters to form a valid word. Hint: words are related to common topics.'
  ),
  (
    'Chemistry Quiz',
    'Challenge your knowledge of the periodic table, chemical reactions, and molecular structures.',
    'Medium',
    20,
    'Science',
    'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400',
    'Answer multiple choice questions about chemistry concepts. Each correct answer adds to your score!'
  ),
  (
    'Geography Challenge',
    'Test your knowledge of world capitals, countries, and landmarks.',
    'Medium',
    25,
    'Geography',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=400',
    'Identify countries, capitals, and geographical features. Explore the world from your screen!'
  ),
  (
    'Code Breaker',
    'Solve programming logic puzzles and algorithm challenges.',
    'Hard',
    30,
    'Computer Science',
    'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=400',
    'Analyze code snippets and determine the output or fix bugs. Test your programming knowledge!'
  ),
  (
    'History Timeline',
    'Arrange historical events in chronological order to test your knowledge of world history.',
    'Medium',
    20,
    'History',
    'https://images.unsplash.com/photo-1461360370896-922624d12aa1?w=400',
    'Drag and drop events to place them in the correct chronological order.'
  )
ON CONFLICT DO NOTHING;

-- Insert Sample Study Materials
INSERT INTO study_materials (title, description, subject, difficulty, content, points_reward) VALUES
  (
    'Introduction to Algebra',
    'Learn the fundamentals of algebraic expressions, equations, and problem-solving techniques.',
    'Mathematics',
    'Beginner',
    '# Introduction to Algebra\n\nAlgebra is a branch of mathematics that uses symbols and letters to represent numbers and quantities in formulas and equations.\n\n## Key Concepts:\n- Variables and Constants\n- Expressions and Equations\n- Solving Linear Equations\n- Order of Operations\n\nPractice solving: 2x + 5 = 15',
    15
  ),
  (
    'Shakespeare''s Greatest Works',
    'Explore the themes, characters, and literary devices in Shakespeare''s most famous plays.',
    'Language Arts',
    'Intermediate',
    '# Shakespeare''s Greatest Works\n\nWilliam Shakespeare (1564-1616) is widely regarded as the greatest writer in the English language.\n\n## Major Works:\n- Romeo and Juliet\n- Hamlet\n- Macbeth\n- A Midsummer Night''s Dream\n\nStudy the themes of love, betrayal, and ambition.',
    20
  ),
  (
    'The Water Cycle',
    'Understanding evaporation, condensation, precipitation, and collection in Earth''s water cycle.',
    'Science',
    'Beginner',
    '# The Water Cycle\n\nThe water cycle describes how water moves around Earth through different states.\n\n## Stages:\n1. Evaporation - Water turns into vapor\n2. Condensation - Vapor forms clouds\n3. Precipitation - Rain or snow falls\n4. Collection - Water gathers in oceans, lakes\n\nThis cycle repeats continuously!',
    15
  ),
  (
    'World War II Overview',
    'A comprehensive look at the causes, major events, and consequences of World War II.',
    'History',
    'Advanced',
    '# World War II (1939-1945)\n\nWWII was a global conflict involving most of the world''s nations.\n\n## Key Events:\n- 1939: Germany invades Poland\n- 1941: Pearl Harbor attack\n- 1944: D-Day invasion\n- 1945: War ends in Europe and Pacific\n\nThe war reshaped the modern world.',
    25
  ),
  (
    'Introduction to Python Programming',
    'Learn the basics of Python programming including variables, loops, and functions.',
    'Computer Science',
    'Beginner',
    '# Introduction to Python\n\nPython is a versatile, beginner-friendly programming language.\n\n## Basic Concepts:\n```python\n# Variables\nname = "DapsiGames"\npoints = 100\n\n# Loops\nfor i in range(5):\n    print(i)\n\n# Functions\ndef greet(name):\n    return f"Hello, {name}!"\n```',
    20
  ),
  (
    'Solar System Exploration',
    'Discover the planets, moons, and other celestial bodies in our solar system.',
    'Science',
    'Intermediate',
    '# The Solar System\n\nOur solar system contains 8 planets orbiting the Sun.\n\n## Planets (in order):\n1. Mercury - Smallest planet\n2. Venus - Hottest planet\n3. Earth - Our home\n4. Mars - The Red Planet\n5. Jupiter - Largest planet\n6. Saturn - Planet with rings\n7. Uranus - Tilted axis\n8. Neptune - Farthest from Sun',
    18
  )
ON CONFLICT DO NOTHING;
