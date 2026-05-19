import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/get-user-role";

/** Любой пользователь с role `admin` в profiles — полный доступ к админ-разделу и всем клиентам. */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = await getUserRole(user.id);
  if (role !== "admin") {
    redirect("/dashboard");
  }

  return { user, supabase };
}

export async function requireClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = await getUserRole(user.id);
  if (role !== "client") {
    redirect("/admin");
  }

  return { user, supabase };
}
