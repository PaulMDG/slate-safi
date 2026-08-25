CREATE UNIQUE INDEX IF NOT EXISTS social_posts_source_platform_key
  ON public.social_posts (platform, source_type, source_id)
  WHERE source_id IS NOT NULL;