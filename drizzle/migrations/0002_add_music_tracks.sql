CREATE TABLE public.music_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  album text,
  audio_url text NOT NULL,
  cover_url text,
  film_id uuid REFERENCES public.films(id) ON DELETE SET NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.music_tracks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.music_tracks TO authenticated;
GRANT ALL ON public.music_tracks TO service_role;
ALTER TABLE public.music_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published tracks are public" ON public.music_tracks FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins read all tracks" ON public.music_tracks FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage tracks" ON public.music_tracks FOR ALL TO authenticated USING (private.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER music_tracks_updated_at BEFORE UPDATE ON public.music_tracks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();