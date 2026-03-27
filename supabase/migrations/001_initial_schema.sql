// Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT,
  year TEXT,
  avatar_url TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_ratings INTEGER DEFAULT 0,
  sold_count INTEGER DEFAULT 0,
  expo_push_token TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTINGS
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 3 AND 100),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 20 AND 1000),
  price INTEGER NOT NULL CHECK (price BETWEEN 1 AND 1000000),
  category TEXT NOT NULL CHECK (category IN ('Electronics','Books','Clothing','Furniture','Sports','Stationery','Other')),
  condition TEXT NOT NULL CHECK (condition IN ('Like New','Good','Fair','Poor')),
  location TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_sold BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_category ON listings(category);
CREATE INDEX idx_listings_active_created ON listings(is_active, is_sold, created_at DESC);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_search ON listings USING gin(to_tsvector('english', title || ' ' || description));

-- CONVERSATIONS
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(listing_id, buyer_id, seller_id),
  CHECK (buyer_id != seller_id)
);

CREATE INDEX idx_conversations_buyer ON conversations(buyer_id, last_message_at DESC);
CREATE INDEX idx_conversations_seller ON conversations(seller_id, last_message_at DESC);

-- MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at ASC);

-- WISHLIST
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_wishlist_user ON wishlist(user_id);

-- RATINGS
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT CHECK (char_length(comment) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rater_id, listing_id),
  CHECK (rater_id != rated_user_id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('new_message','buy_interest','item_sold','wishlist_save')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- REPORTS
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam','inappropriate','fake','other')),
  details TEXT CHECK (char_length(details) <= 500),
  is_reviewed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AUTO-UPDATE updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AUTO-UPDATE user rating when a new rating is inserted
CREATE OR REPLACE FUNCTION refresh_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET
    rating = (SELECT ROUND(AVG(score)::numeric, 2) FROM ratings WHERE rated_user_id = NEW.rated_user_id),
    total_ratings = (SELECT COUNT(*) FROM ratings WHERE rated_user_id = NEW.rated_user_id)
  WHERE id = NEW.rated_user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_refresh_rating AFTER INSERT OR UPDATE ON ratings FOR EACH ROW EXECUTE FUNCTION refresh_user_rating();

-- AUTO-INCREMENT sold_count when listing marked as sold
CREATE OR REPLACE FUNCTION increment_sold_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_sold = TRUE AND OLD.is_sold = FALSE THEN
    UPDATE users SET sold_count = sold_count + 1 WHERE id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sold_count AFTER UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION increment_sold_count();

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- USERS
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can insert their own profile"
  ON users FOR INSERT TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid());

-- LISTINGS
CREATE POLICY "Active listings viewable by authenticated users"
  ON listings FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Users can insert their own listings"
  ON listings FOR INSERT TO authenticated
  WITH CHECK (seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can update their own listings"
  ON listings FOR UPDATE TO authenticated
  USING (seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can delete their own listings"
  ON listings FOR DELETE TO authenticated
  USING (seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- CONVERSATIONS
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT TO authenticated
  USING (
    buyer_id  = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create conversations"
  ON conversations FOR INSERT TO authenticated
  WITH CHECK (buyer_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Participants can update conversation (unread counts)"
  ON conversations FOR UPDATE TO authenticated
  USING (
    buyer_id  = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
    seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- MESSAGES
CREATE POLICY "Conversation participants can read messages"
  ON messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        buyer_id  = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Conversation participants can send messages"
  ON messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()) AND
    conversation_id IN (
      SELECT id FROM conversations WHERE
        buyer_id  = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "Recipients can mark messages as read"
  ON messages FOR UPDATE TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        buyer_id  = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
        seller_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
  );

-- WISHLIST
CREATE POLICY "Users manage their own wishlist"
  ON wishlist FOR ALL TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- RATINGS
CREATE POLICY "Ratings are public"
  ON ratings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can submit ratings"
  ON ratings FOR INSERT TO authenticated
  WITH CHECK (rater_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- NOTIFICATIONS
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can mark own notifications as read"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- REPORTS
CREATE POLICY "Users can submit reports"
  ON reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));
