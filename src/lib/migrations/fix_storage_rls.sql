-- ===================================================================
-- Fix Storage RLS — allow authenticated users to upload to 'public' bucket
-- Run in: Supabase Dashboard → SQL Editor
-- ===================================================================

-- 1. Allow authenticated users to upload files to 'public' bucket
CREATE POLICY "auth_users_can_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'public');

-- 2. Allow authenticated users to update files in 'public' bucket
CREATE POLICY "auth_users_can_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'public')
  WITH CHECK (bucket_id = 'public');

-- 3. Allow authenticated users to delete files in 'public' bucket
CREATE POLICY "auth_users_can_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'public');

-- 4. Allow everyone to read/view files in 'public' bucket
CREATE POLICY "public_read_access" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'public');
