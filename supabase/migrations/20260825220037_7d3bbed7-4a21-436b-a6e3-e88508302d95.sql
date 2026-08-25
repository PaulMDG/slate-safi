CREATE TABLE public.social_credentials (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,
  key_name text NOT NULL,
  value text NOT NULL,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (platform, key_name)
);

GRANT ALL ON public.social_credentials TO service_role;

ALTER TABLE public.social_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to social credentials"
  ON public.social_credentials FOR ALL
  TO anon, authenticated
  USING (false) WITH CHECK (false);

CREATE TRIGGER update_social_credentials_updated_at
  BEFORE UPDATE ON public.social_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();