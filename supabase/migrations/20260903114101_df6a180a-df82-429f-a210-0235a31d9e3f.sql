CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_user_char ON public.messages(user_id, character_id, created_at);

GRANT SELECT, INSERT, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own messages" ON public.messages FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_message_usage(_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTEGER;
BEGIN
  INSERT INTO public.message_usage (user_id, messages_used)
  VALUES (_user_id, 1)
  ON CONFLICT (user_id) DO UPDATE
    SET messages_used = public.message_usage.messages_used + 1,
        updated_at = now()
  RETURNING messages_used INTO total;
  RETURN total;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_message_usage(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_message_usage(UUID) TO service_role;