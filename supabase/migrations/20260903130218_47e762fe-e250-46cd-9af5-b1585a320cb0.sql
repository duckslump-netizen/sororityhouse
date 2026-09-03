-- 1. Lock down character_settings: no public/anon/authenticated reads.
DROP POLICY IF EXISTS "Anyone can read character settings" ON public.character_settings;
REVOKE ALL ON public.character_settings FROM anon;
REVOKE ALL ON public.character_settings FROM authenticated;
GRANT ALL ON public.character_settings TO service_role;

-- 2. has_role is a SECURITY DEFINER function; signed-in users no longer need to call it directly.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;