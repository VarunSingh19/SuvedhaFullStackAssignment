/*
  # Create storage bucket for certificates

  1. New Storage Bucket
    - Creates a new public bucket named 'certificates' for storing offer letters
  2. Security
    - Enables public access for authenticated users
    - Sets up appropriate RLS policies
*/

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "storage";

-- Create the storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'certificates');

-- Policy to allow public to read files
CREATE POLICY "Allow public to read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'certificates');

-- Policy to allow authenticated users to update their own files
CREATE POLICY "Allow users to update their own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'certificates' AND auth.uid() = owner)
WITH CHECK (bucket_id = 'certificates' AND auth.uid() = owner);

-- Policy to allow authenticated users to delete their own files
CREATE POLICY "Allow users to delete their own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'certificates' AND auth.uid() = owner);