DROP VIEW IF EXISTS public.characters_public;

-- Column-level grants: catalog columns readable, system_prompt never exposed
REVOKE SELECT ON public.character_settings FROM anon, authenticated;
GRANT SELECT (character_id, name, tag, tagline, price_id, unlock_type, unlock_character, unlock_level, sort_order, enabled, created_at, updated_at)
  ON public.character_settings TO anon, authenticated;

CREATE POLICY "Anyone can read enabled characters"
ON public.character_settings
FOR SELECT
TO anon, authenticated
USING (enabled = true);