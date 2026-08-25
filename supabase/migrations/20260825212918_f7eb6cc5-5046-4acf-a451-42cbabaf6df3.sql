CREATE TABLE public.social_automation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE CHECK (singleton),
  auto_publish_films boolean NOT NULL DEFAULT true,
  auto_publish_posts boolean NOT NULL DEFAULT true,
  platforms text[] NOT NULL DEFAULT ARRAY['x','instagram','linkedin'],
  delay_minutes integer NOT NULL DEFAULT 5,
  evergreen_enabled boolean NOT NULL DEFAULT false,
  evergreen_interval_days integer NOT NULL DEFAULT 21,
  evergreen_platforms text[] NOT NULL DEFAULT ARRAY['x','instagram'],
  daily_cap integer NOT NULL DEFAULT 6,
  utm_source text NOT NULL DEFAULT 'social',
  utm_medium text NOT NULL DEFAULT 'organic',
  utm_campaign text NOT NULL DEFAULT 'slate-safi',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.social_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.social_posts(id) ON DELETE CASCADE,
  impressions integer NOT NULL DEFAULT 0,
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id)
);

CREATE TABLE public.social_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  platform text,
  post_id uuid REFERENCES public.social_posts(id) ON DELETE SET NULL,
  message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX social_events_created_at_idx ON public.social_events (created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_automation TO authenticated;
GRANT ALL ON public.social_automation TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_metrics TO authenticated;
GRANT ALL ON public.social_metrics TO service_role;
GRANT SELECT, DELETE ON public.social_events TO authenticated;
GRANT ALL ON public.social_events TO service_role;

ALTER TABLE public.social_automation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage social automation" ON public.social_automation
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage social metrics" ON public.social_metrics
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins read social events" ON public.social_events
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins clear social events" ON public.social_events
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER social_automation_updated_at BEFORE UPDATE ON public.social_automation
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.social_automation (singleton) VALUES (true);