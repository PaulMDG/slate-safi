CREATE TABLE public.photo_gallery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  caption text,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.photo_gallery TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.photo_gallery TO authenticated;
GRANT ALL ON public.photo_gallery TO service_role;

ALTER TABLE public.photo_gallery ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published photos are public" ON public.photo_gallery
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins can read all photos" ON public.photo_gallery
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage photos" ON public.photo_gallery
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));