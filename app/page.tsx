import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth/get-user-role";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const role = await getUserRole(user.id);
  if (role === "admin") {
    redirect("/admin");
  }
  if (role === "client") {
    redirect("/dashboard");
  }

  redirect("/auth");
}
