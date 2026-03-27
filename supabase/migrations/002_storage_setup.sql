-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Set up RLS for the bucket
-- Allow anyone to view images (Selection)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'listing-images' );

-- Allow authenticated users to upload images to their own folder (Insertion)
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own images (Update)
CREATE POLICY "Users can update their own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images (Deletion)
CREATE POLICY "Users can delete their own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'listing-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);-- 5. IMPORTANT: CORS SETTINGS
-- For images to show up on your website, you also need to:
-- 1. Go to Supabase Dashboard -> Storage -> Settings
-- 2. Find the "listing-images" bucket
-- 3. In the "CORS" section, ensure it allows "*" (or your Vercel URL)
