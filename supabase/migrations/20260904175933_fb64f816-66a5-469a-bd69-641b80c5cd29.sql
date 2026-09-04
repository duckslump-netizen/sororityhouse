-- Monthly usage, bonus balance and referral fields
ALTER TABLE public.message_usage
  ADD COLUMN IF NOT EXISTS bonus_messages integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS free_suggestions integer NOT NULL DEFAULT 0;

UPDATE public.profiles
SET referral_code = upper(substr(replace(id::text, '-', ''), 1, 8))
WHERE referral_code IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_referral_code_key ON public.profiles (referral_code);

CREATE TABLE IF NOT EXISTS public.monthly_message_usage (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  messages_used integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, period_start)
);
GRANT SELECT ON public.monthly_message_usage TO authenticated;
GRANT ALL ON public.monthly_message_usage TO service_role;
ALTER TABLE public.monthly_message_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own monthly usage" ON public.monthly_message_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  subscribed boolean NOT NULL DEFAULT false,
  reward_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (auth.uid() = referrer_id);

CREATE TABLE IF NOT EXISTS public.girl_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  vibe text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  visibility text NOT NULL DEFAULT 'private',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.girl_suggestions TO authenticated;
GRANT ALL ON public.girl_suggestions TO service_role;
ALTER TABLE public.girl_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own suggestions" ON public.girl_suggestions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Members view shared suggestions" ON public.girl_suggestions
  FOR SELECT TO authenticated USING (visibility = 'shared');

CREATE OR REPLACE FUNCTION public.increment_monthly_usage(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total integer;
BEGIN
  INSERT INTO public.monthly_message_usage (user_id, period_start, messages_used)
  VALUES (_user_id, date_trunc('month', now())::date, 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET messages_used = public.monthly_message_usage.messages_used + 1,
                updated_at = now()
  RETURNING messages_used INTO _total;
  RETURN _total;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.increment_monthly_usage(uuid) FROM anon, authenticated;