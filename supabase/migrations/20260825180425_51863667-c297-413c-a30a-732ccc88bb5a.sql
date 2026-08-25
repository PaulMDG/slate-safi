CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.has_role(uuid, public.app_role) SET SCHEMA private;
ALTER FUNCTION private.has_role(uuid, public.app_role) SET search_path = public;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

DROP POLICY IF EXISTS "Authenticated can read credits" ON public.film_credits;
DROP POLICY IF EXISTS "Credits are public" ON public.film_credits;
CREATE POLICY "Credits of published films are readable"
ON public.film_credits FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.films f WHERE f.id = film_credits.film_id AND f.published = true));

DROP POLICY IF EXISTS "Authenticated can read gallery" ON public.film_gallery;
DROP POLICY IF EXISTS "Gallery is public" ON public.film_gallery;
CREATE POLICY "Gallery of published films is readable"
ON public.film_gallery FOR SELECT TO anon, authenticated
USING (EXISTS (SELECT 1 FROM public.films f WHERE f.id = film_gallery.film_id AND f.published = true));