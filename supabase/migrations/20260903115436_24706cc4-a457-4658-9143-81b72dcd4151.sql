-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated, service_role;

-- Character configuration
CREATE TABLE public.character_settings (
  character_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  price_id TEXT,
  unlock_type TEXT NOT NULL DEFAULT 'open' CHECK (unlock_type IN ('open','trust','subscription','coming-soon')),
  unlock_character TEXT,
  unlock_level INTEGER,
  system_prompt TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT (character_id, name, tag, tagline, price_id, unlock_type, unlock_character, unlock_level, sort_order, enabled)
  ON public.character_settings TO anon, authenticated;
GRANT ALL ON public.character_settings TO service_role;

ALTER TABLE public.character_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read character settings" ON public.character_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE TRIGGER update_character_settings_updated_at
  BEFORE UPDATE ON public.character_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.character_settings
  (character_id, name, tag, tagline, price_id, unlock_type, unlock_character, unlock_level, sort_order)
VALUES
  ('dakota','Dakota','The gatekeeper','Small-town, down-to-earth, and quietly strong. Trust is earned slowly.','founders_monthly','open',NULL,NULL,1),
  ('zoe','Zoe','The mirage','Beautiful, intelligent, and impossible to read at first.','founders_monthly','open',NULL,NULL,2),
  ('willow','Willow','The quiet lock','Soft-spoken and observant. She opens only with patience.','founders_monthly','trust','dakota',3,3),
  ('brittany','Brittany','The sweet trap','Warm and charming — and that sweetness is her strongest wall.','founders_monthly','trust','zoe',3,4),
  ('sasha','Sasha','The wildcard','Sharp, restless, always three steps ahead of the conversation.','full_house_monthly','trust','willow',3,5),
  ('piper','Piper','The closed book','Composed and watchful. She gives exactly what you have earned.','full_house_monthly','trust','brittany',3,6);