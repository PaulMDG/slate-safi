CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL UNIQUE CHECK (platform IN ('x','instagram','linkedin')),
  handle text,
  display_name text,
  connected boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage social accounts" ON public.social_accounts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER social_accounts_updated_at BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.social_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('x','instagram','linkedin')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','posting','posted','failed','cancelled')),
  caption text NOT NULL DEFAULT '',
  media_url text,
  link_url text,
  source_type text NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual','film','post')),
  source_id uuid,
  scheduled_for timestamptz,
  posted_at timestamptz,
  external_id text,
  external_url text,
  error text,
  attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX social_posts_due_idx ON public.social_posts (status, scheduled_for);
CREATE UNIQUE INDEX social_posts_source_unique_idx ON public.social_posts (platform, source_type, source_id)
  WHERE source_type <> 'manual' AND source_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_posts TO authenticated;
GRANT ALL ON public.social_posts TO service_role;
ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage social posts" ON public.social_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER social_posts_updated_at BEFORE UPDATE ON public.social_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.social_accounts (platform, handle, display_name, connected) VALUES
  ('x', '@slatesafi', 'Slate Safi on X', false),
  ('instagram', '@slatesafi', 'Slate Safi on Instagram', false),
  ('linkedin', 'slate-safi', 'Slate Safi on LinkedIn', false);