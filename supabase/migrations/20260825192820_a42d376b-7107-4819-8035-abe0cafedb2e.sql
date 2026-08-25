CREATE TABLE public.homepage_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true,
  hero_eyebrow text,
  hero_title text,
  hero_logline text,
  hero_cta_label text,
  hero_image_url text,
  slate_eyebrow text,
  slate_heading text,
  news_eyebrow text,
  news_heading text,
  newsletter_heading text,
  newsletter_body text,
  partner_heading text,
  partner_body text,
  partner_cta_label text,
  show_laurels boolean NOT NULL DEFAULT true,
  show_quotes boolean NOT NULL DEFAULT true,
  show_news boolean NOT NULL DEFAULT true,
  show_newsletter boolean NOT NULL DEFAULT true,
  show_partner boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT homepage_content_singleton_key UNIQUE (singleton)
);

GRANT SELECT ON public.homepage_content TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_content TO authenticated;
GRANT ALL ON public.homepage_content TO service_role;

ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homepage content is publicly readable"
  ON public.homepage_content FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage homepage content"
  ON public.homepage_content FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_homepage_content_updated_at
  BEFORE UPDATE ON public.homepage_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.homepage_content (
  hero_eyebrow, hero_cta_label,
  slate_eyebrow, slate_heading,
  news_eyebrow, news_heading,
  newsletter_heading, newsletter_body,
  partner_heading, partner_body, partner_cta_label
) VALUES (
  'Slate Safi', 'Watch the trailer',
  'The slate', 'Two features. One point of view.',
  'Latest', 'From the studio',
  'Festival dates, releases, first looks.',
  'A short dispatch for audiences, programmers and press. No more than once a month.',
  'Back a slate that already travels.',
  'Brand partnership, co-production, festival support and distribution — we work with partners across Kenya, the UK, Canada and the US.',
  'Partner with us'
);