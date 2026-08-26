ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS hero_cta_url text,
  ADD COLUMN IF NOT EXISTS hero_status_label text,
  ADD COLUMN IF NOT EXISTS newsletter_eyebrow text,
  ADD COLUMN IF NOT EXISTS partner_eyebrow text,
  ADD COLUMN IF NOT EXISTS slideshow_interval_ms integer NOT NULL DEFAULT 6500,
  ADD COLUMN IF NOT EXISTS show_slideshow boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.homepage_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  eyebrow text,
  title text,
  logline text,
  cta_label text,
  cta_url text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.homepage_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_slides TO authenticated;
GRANT ALL ON public.homepage_slides TO service_role;

ALTER TABLE public.homepage_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published slides are public" ON public.homepage_slides
  FOR SELECT TO anon, authenticated USING (published = true);

CREATE POLICY "Admins manage slides" ON public.homepage_slides
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_homepage_slides_updated_at
  BEFORE UPDATE ON public.homepage_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
