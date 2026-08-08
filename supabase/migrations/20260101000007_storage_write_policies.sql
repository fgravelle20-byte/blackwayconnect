-- Storage write policies: update + delete for org members
-- Path convention: {organization_id}/{resource_id}/filename

DROP POLICY IF EXISTS "org members update own docs" ON storage.objects;
CREATE POLICY "org members update own docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('org-documents', 'org-assets', 'chatbot-kb')
  AND has_org_role((storage.foldername(name))[1]::uuid, 'member')
)
WITH CHECK (
  bucket_id IN ('org-documents', 'org-assets', 'chatbot-kb')
  AND has_org_role((storage.foldername(name))[1]::uuid, 'member')
);

DROP POLICY IF EXISTS "org admins delete docs" ON storage.objects;
CREATE POLICY "org admins delete docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('org-documents', 'org-assets', 'chatbot-kb')
  AND has_org_role((storage.foldername(name))[1]::uuid, 'admin')
);
