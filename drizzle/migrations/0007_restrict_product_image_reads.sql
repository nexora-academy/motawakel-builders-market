DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Read images of active products" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'product-images' AND (
      EXISTS (SELECT 1 FROM public.products p WHERE p.is_active = true AND p.image_url = 'storage:' || storage.objects.name)
      OR public.has_role(auth.uid(), 'admin')
    )
  );