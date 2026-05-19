"use server";

import { revalidatePath } from "next/cache";
import { generateTempPassword } from "@/lib/auth/generate-temp-password";
import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type DeleteAdminResult = { error?: string; success?: true };

export type ResetAdminPasswordState = {
  error?: string;
  newPassword?: string;
};

export async function resetAdminPasswordAction(
  adminId: string,
  _prevState: ResetAdminPasswordState,
  _formData: FormData,
): Promise<ResetAdminPasswordState> {
  await requireAdmin();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", adminId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    return { error: "Администратор не найден." };
  }

  const newPassword = generateTempPassword();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(adminId, {
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { newPassword };
}

export async function deleteAdminAction(adminId: string): Promise<DeleteAdminResult> {
  const { user } = await requireAdmin();

  if (user.id === adminId) {
    return { error: "Нельзя удалить собственный аккаунт." };
  }

  const supabaseAdmin = createSupabaseAdminClient();

  const { count, error: countError } = await supabaseAdmin
    .from("profiles")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countError) {
    return { error: countError.message };
  }

  if ((count ?? 0) <= 1) {
    return { error: "Нельзя удалить последнего администратора в системе." };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", adminId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    return { error: "Администратор не найден или уже удалён." };
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(adminId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/admins");
  return { success: true };
}
