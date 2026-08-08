-- Storage buckets for NoirRoutes
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('org-documents', 'org-documents', false),
  ('org-assets', 'org-assets', false),
  ('chatbot-kb', 'chatbot-kb', false)
ON CONFLICT (id) DO NOTHING;

-- Path convention: {organization_id}/{resource_id}/filename
CREATE POLICY "org members read own docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('org-documents', 'org-assets', 'chatbot-kb')
  AND (storage.foldername(name))[1]::uuid IN (SELECT requesting_org_ids())
);

CREATE POLICY "org admins upload docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('org-documents', 'org-assets', 'chatbot-kb')
  AND has_org_role((storage.foldername(name))[1]::uuid, 'member')
);
