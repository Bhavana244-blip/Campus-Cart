-- Rename tables to match the codebase
ALTER TABLE IF EXISTS products RENAME TO listings;
ALTER TABLE IF EXISTS profiles RENAME TO users;
ALTER TABLE IF EXISTS saved_items RENAME TO wishlist;

-- Note: After renaming, you might need to re-enable RLS policies 
-- or update your existing policies if they were tied specifically to the old names.
-- I recommend running the 001_initial_schema.sql again if there are no data you want to keep.
