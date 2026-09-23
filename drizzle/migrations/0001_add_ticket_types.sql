CREATE TABLE public.ticket_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price_kes numeric NOT NULL DEFAULT 0,
  capacity integer,
  screening_id uuid REFERENCES public.screenings(id) ON DELETE CASCADE,
  film_id uuid REFERENCES public.films(id) ON DELETE CASCADE,
  cinema_id uuid REFERENCES public.cinemas(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ticket_types_screening_idx ON public.ticket_types (screening_id);
CREATE INDEX ticket_types_film_idx ON public.ticket_types (film_id);
CREATE INDEX ticket_types_cinema_idx ON public.ticket_types (cinema_id);

GRANT SELECT ON public.ticket_types TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_types TO authenticated;
GRANT ALL ON public.ticket_types TO service_role;

ALTER TABLE public.ticket_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published ticket types are public"
ON public.ticket_types FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins read all ticket types"
ON public.ticket_types FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage ticket types"
ON public.ticket_types FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER ticket_types_updated_at
BEFORE UPDATE ON public.ticket_types
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tickets ADD COLUMN ticket_type_id uuid REFERENCES public.ticket_types(id) ON DELETE SET NULL;
ALTER TABLE public.tickets ADD COLUMN ticket_type_name text;
