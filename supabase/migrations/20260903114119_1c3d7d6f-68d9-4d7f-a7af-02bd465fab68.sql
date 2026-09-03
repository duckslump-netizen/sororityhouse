REVOKE ALL ON FUNCTION public.increment_message_usage(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_active_subscription(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_message_usage(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(UUID, TEXT) TO service_role;