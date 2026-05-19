import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/profile";

export async function getUserRole(userId: string): Promise<AppRole | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data?.role) {
    return null;
  }

  return data.role as AppRole;
}
