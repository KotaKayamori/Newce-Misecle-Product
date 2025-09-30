-- Insert sample comments
INSERT INTO restaurant_comments (user_id, restaurant_id, rating, comment) VALUES
-- Note: Replace with actual user UUIDs when available
-- ('user-uuid-1', 1, 4.5, '雰囲気が良く、料理も美味しかったです。特にデザートが絶品でした！'),
-- ('user-uuid-1', 4, 4.8, 'お肉の質が素晴らしく、サービスも丁寧でした。');

-- Update restaurants with more detailed information
UPDATE restaurants SET 
  available_seats = CASE 
    WHEN id = 1 THEN 3
    WHEN id = 2 THEN 2
    WHEN id = 3 THEN 5
    WHEN id = 4 THEN 4
    WHEN id = 5 THEN 2
    WHEN id = 6 THEN 1
  END,
  rating = CASE 
    WHEN id = 1 THEN 4.5
    WHEN id = 2 THEN 4.8
    WHEN id = 3 THEN 4.3
    WHEN id = 4 THEN 4.6
    WHEN id = 5 THEN 4.2
    WHEN id = 6 THEN 4.7
  END;

-- Add crowd level and opening hours (stored as JSON for flexibility)
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

UPDATE restaurants SET metadata = jsonb_build_object(
  'crowdLevel', CASE 
    WHEN id = 1 THEN '普通'
    WHEN id = 2 THEN '混雑'
    WHEN id = 3 THEN '空いている'
    WHEN id = 4 THEN '普通'
    WHEN id = 5 THEN '普通'
    WHEN id = 6 THEN '空いている'
  END,
  'openingHours', CASE 
    WHEN id = 1 THEN '11:00-22:00'
    WHEN id = 2 THEN '17:00-23:00'
    WHEN id = 3 THEN '12:00-21:00'
    WHEN id = 4 THEN '17:00-24:00'
    WHEN id = 5 THEN '11:30-22:00'
    WHEN id = 6 THEN '17:30-22:30'
  END,
  'isOpen', true
);
