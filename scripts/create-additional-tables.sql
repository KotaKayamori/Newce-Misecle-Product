-- Create restaurant_comments table
CREATE TABLE IF NOT EXISTS restaurant_comments (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
  rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  restaurant_reply TEXT,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comment_reactions table
CREATE TABLE IF NOT EXISTS comment_reactions (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER NOT NULL REFERENCES restaurant_comments(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reaction_type VARCHAR(20) NOT NULL CHECK (reaction_type IN ('heart', 'thumbsup', 'thumbsdown')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id, reaction_type)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reservations_user_id ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_restaurant_id ON reservations(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

CREATE INDEX IF NOT EXISTS idx_restaurant_comments_user_id ON restaurant_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_comments_restaurant_id ON restaurant_comments(restaurant_id);

CREATE INDEX IF NOT EXISTS idx_restaurants_genre ON restaurants(genre);
CREATE INDEX IF NOT EXISTS idx_restaurants_available_now ON restaurants(available_now);
CREATE INDEX IF NOT EXISTS idx_restaurants_subscription_discount ON restaurants(subscription_discount);

-- Create RLS policies
ALTER TABLE restaurant_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_reactions ENABLE ROW LEVEL SECURITY;

-- Users can read all comments
CREATE POLICY "Users can read all comments" ON restaurant_comments
  FOR SELECT USING (true);

-- Users can insert their own comments
CREATE POLICY "Users can insert their own comments" ON restaurant_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" ON restaurant_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can read all reactions
CREATE POLICY "Users can read all reactions" ON comment_reactions
  FOR SELECT USING (true);

-- Users can manage their own reactions
CREATE POLICY "Users can manage their own reactions" ON comment_reactions
  FOR ALL USING (auth.uid() = user_id);
