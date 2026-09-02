CREATE TABLE public.cinemas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  chain text,
  city text,
  ticketing_url text,
  booking_note text,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cinemas TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cinemas TO authenticated;
GRANT ALL ON public.cinemas TO service_role;

ALTER TABLE public.cinemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published cinemas are public" ON public.cinemas
  FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Admins can read all cinemas" ON public.cinemas
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage cinemas" ON public.cinemas
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER cinemas_updated_at BEFORE UPDATE ON public.cinemas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  film_id uuid NOT NULL REFERENCES public.films(id) ON DELETE CASCADE,
  cinema_id uuid NOT NULL REFERENCES public.cinemas(id) ON DELETE RESTRICT,
  kind text NOT NULL DEFAULT 'screening',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  screen_label text,
  city text,
  ticket_url text,
  note text,
  sold_out boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX screenings_starts_at_idx ON public.screenings (starts_at);
CREATE INDEX screenings_film_idx ON public.screenings (film_id);

GRANT SELECT ON public.screenings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.screenings TO authenticated;
GRANT ALL ON public.screenings TO service_role;

ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published screenings are public" ON public.screenings
  FOR SELECT TO anon, authenticated
  USING (
    published = true
    AND EXISTS (SELECT 1 FROM public.films f WHERE f.id = film_id AND f.published = true)
  );
CREATE POLICY "Admins can read all screenings" ON public.screenings
  FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage screenings" ON public.screenings
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'))
  WITH CHECK (private.has_role(auth.uid(), 'admin'));

CREATE TRIGGER screenings_updated_at BEFORE UPDATE ON public.screenings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cinemas (name, chain, city, ticketing_url, booking_note, sort_order) VALUES
  ('Anga Diamond Plaza', 'Anga Cinemas', 'Nairobi', 'https://www.angacinemas.com', 'Book online or at the box office.', 0),
  ('Anga Sky, Garden City', 'Anga Cinemas', 'Nairobi', 'https://www.angacinemas.com', 'Book online or at the box office.', 1),
  ('Century Cinemax, Garden City', 'Century Cinemax', 'Nairobi', 'https://www.centurycinemax.co.ke', 'Online booking available.', 2),
  ('Century Cinemax, The Junction', 'Century Cinemax', 'Nairobi', 'https://www.centurycinemax.co.ke', 'Online booking available.', 3),
  ('Prestige Plaza Cinema', 'Prestige Cinema', 'Nairobi', 'https://www.prestigecinema.co.ke', 'Tickets at the box office and online.', 4),
  ('Westgate Cinema', 'Westgate', 'Nairobi', 'https://www.westgatecinema.co.ke', 'Online booking available.', 5),
  ('IMAX Nairobi, 20th Century', 'IMAX', 'Nairobi', 'https://www.imaxnairobi.co.ke', 'Large-format screenings.', 6),
  ('Nyali Cinemax', 'Nyali Cinemax', 'Mombasa', 'https://www.nyalicinemax.co.ke', 'Coast screenings.', 7),
  ('Alliance Française Nairobi', 'Alliance Française', 'Nairobi', 'https://www.afkenya.or.ke', 'Festival and special screenings.', 8);