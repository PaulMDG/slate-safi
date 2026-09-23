ALTER TABLE public.screenings
  ADD COLUMN IF NOT EXISTS tickets_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_kes numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS ticket_terms text;

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  screening_id uuid NOT NULL REFERENCES public.screenings(id) ON DELETE RESTRICT,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_kes numeric(10,2) NOT NULL DEFAULT 0,
  total_kes numeric(10,2) NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  mpesa_checkout_request_id text,
  mpesa_merchant_request_id text,
  mpesa_receipt text,
  mpesa_phone text,
  payment_error text,
  qr_token text NOT NULL,
  email_sent_at timestamptz,
  email_error text,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.tickets TO authenticated;
GRANT ALL ON public.tickets TO service_role;

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read tickets" ON public.tickets
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE POLICY "Admins update tickets" ON public.tickets
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE INDEX IF NOT EXISTS tickets_screening_idx ON public.tickets (screening_id);
CREATE INDEX IF NOT EXISTS tickets_checkout_idx ON public.tickets (mpesa_checkout_request_id);

CREATE TRIGGER tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.mpesa_callbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkout_request_id text,
  merchant_request_id text,
  result_code integer,
  result_desc text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.mpesa_callbacks TO authenticated;
GRANT ALL ON public.mpesa_callbacks TO service_role;

ALTER TABLE public.mpesa_callbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read mpesa callbacks" ON public.mpesa_callbacks
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));
