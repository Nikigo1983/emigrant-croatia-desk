import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { AuthMissingProfile } from "@/components/auth-missing-profile";
import { LegalFooter } from "@/components/legal-footer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types/profile";

export const dynamic = "force-dynamic";
export default async function AuthPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    const rawRole = profileRow?.role;
    const role: AppRole | null =
      rawRole === "admin" || rawRole === "client" ? rawRole : null;

    if (role === "admin") {
      redirect("/admin");
    }
    if (role === "client") {
      redirect("/dashboard");
    }

    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12">
        <AuthMissingProfile
          userId={user.id}
          email={user.email ?? ""}
          profileError={profileError?.message ?? null}
          rowRole={typeof rawRole === "string" ? rawRole : null}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-12">
      <AuthForm />
      <LegalFooter />
    </main>
  );
}
