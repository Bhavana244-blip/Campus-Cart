-- SRMCart Phase 2 Database Migration

-- 1. Extend listings table
ALTER TABLE IF EXISTS listings 
ADD COLUMN IF NOT EXISTS semester INTEGER,
ADD COLUMN IF NOT EXISTS is_swap_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS swap_wants TEXT,
ADD COLUMN IF NOT EXISTS archive_date TIMESTAMPTZ;

-- 2. Create Bundles Table
CREATE TABLE IF NOT EXISTS bundles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    bundle_price INTEGER NOT NULL,
    savings INTEGER NOT NULL,
    images TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'ACTIVE', -- ACTIVE, SOLD, ARCHIVED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Bundle Items Table (Linking listings to bundles)
CREATE TABLE IF NOT EXISTS bundle_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bundle_id UUID REFERENCES bundles(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    UNIQUE(bundle_id, listing_id)
);

-- 4. Create Meetup Spots Table
CREATE TABLE IF NOT EXISTS meetup_spots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    zone TEXT NOT NULL, -- TECH_PARK, LIBRARY, etc.
    label TEXT,         -- "Canteen 1 Lobby"
    lat DECIMAL,
    lng DECIMAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Swap Offers Table
CREATE TABLE IF NOT EXISTS swap_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    target_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    offered_listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, ACCEPTED, REJECTED, CANCELLED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create User Stats Table (Gamification)
CREATE TABLE IF NOT EXISTS user_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges TEXT[] DEFAULT '{}',
    total_sales INTEGER DEFAULT 0,
    lifetime_coins INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Add Semester and Archive Date logic
-- (Handled by the Node.js background worker)

-- 8. Add Indices for performance
CREATE INDEX IF NOT EXISTS idx_listings_semester ON listings(semester);
CREATE INDEX IF NOT EXISTS idx_bundles_seller ON bundles(seller_id);
CREATE INDEX IF NOT EXISTS idx_swap_offers_receiver ON swap_offers(receiver_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_xp ON user_stats(xp DESC);
