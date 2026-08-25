REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES ON public.form_rate_limits FROM anon, authenticated;
REVOKE SELECT ON public.form_rate_limits FROM anon;
GRANT SELECT ON public.form_rate_limits TO authenticated;
GRANT ALL ON public.form_rate_limits TO service_role;

DROP POLICY IF EXISTS "No client writes to rate limits" ON public.form_rate_limits;
CREATE POLICY "No client writes to rate limits"
ON public.form_rate_limits
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);