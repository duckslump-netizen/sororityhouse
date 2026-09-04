-- 1. Revoke public/anon/authenticated EXECUTE on SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.increment_monthly_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_message_usage(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 2. Safe public read of the character catalog (excludes system_prompt)
CREATE OR REPLACE VIEW public.characters_public AS
SELECT character_id, name, tag, tagline, unlock_type, unlock_character, unlock_level, sort_order, enabled
FROM public.character_settings
WHERE enabled = true;

GRANT SELECT ON public.characters_public TO anon, authenticated;

-- 3. Referred users can see referral rows naming them
CREATE POLICY "Referred users view own referral"
ON public.referrals
FOR SELECT
TO authenticated
USING (auth.uid() = referred_user_id);