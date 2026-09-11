CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  source TEXT NOT NULL DEFAULT 'link' CHECK (source IN ('link','upload')),
  video_url TEXT NOT NULL,
  poster_url TEXT,
  film_id UUID REFERENCES public.films(id) ON DELETE SET NULL,
  category TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.videos TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.videos TO authenticated;
GRANT ALL ON public.videos TO service_role;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published videos are public" ON public.videos
  FOR SELECT USING (published = true);
CREATE POLICY "Admins can read all videos" ON public.videos
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can insert videos" ON public.videos
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can update videos" ON public.videos
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
CREATE POLICY "Admins can delete videos" ON public.videos
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TABLE public.video_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  contact_type TEXT NOT NULL DEFAULT 'email' CHECK (contact_type IN ('email','whatsapp')),
  video_id UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  source TEXT,
  spam_score INTEGER NOT NULL DEFAULT 0,
  is_spam BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.video_leads TO anon;
GRANT SELECT, INSERT ON public.video_leads TO authenticated;
GRANT ALL ON public.video_leads TO service_role;
ALTER TABLE public.video_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can opt in" ON public.video_leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read opt-ins" ON public.video_leads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

ALTER TABLE public.homepage_content
  ADD COLUMN IF NOT EXISTS spotify_url TEXT,
  ADD COLUMN IF NOT EXISTS spotify_heading TEXT,
  ADD COLUMN IF NOT EXISTS spotify_body TEXT,
  ADD COLUMN IF NOT EXISTS show_spotify BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS videos_eyebrow TEXT,
  ADD COLUMN IF NOT EXISTS videos_heading TEXT,
  ADD COLUMN IF NOT EXISTS videos_body TEXT,
  ADD COLUMN IF NOT EXISTS video_optin_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS video_optin_heading TEXT,
  ADD COLUMN IF NOT EXISTS video_optin_body TEXT;