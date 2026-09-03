/**
 * Server-only role checks.
 *
 * Role lookups run with the service client so the `has_role` SQL function does
 * not need to be executable by signed-in users (which would let any account
 * probe other accounts' roles).
 */
export async function isAdminUser(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) return false;
  return !!data;
}
