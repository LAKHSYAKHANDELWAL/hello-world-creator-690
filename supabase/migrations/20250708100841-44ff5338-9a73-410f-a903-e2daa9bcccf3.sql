
-- Create a storage bucket for announcement files
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcements', 'announcements', true);

-- Create storage policies for the announcements bucket
CREATE POLICY "Allow public uploads to announcements bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'announcements');

CREATE POLICY "Allow public access to announcements files"
ON storage.objects FOR SELECT
USING (bucket_id = 'announcements');

CREATE POLICY "Allow admins to delete announcement files"
ON storage.objects FOR DELETE
USING (bucket_id = 'announcements');
