"use server";

import { revalidatePath } from "next/cache";
import { createAdminUser } from "@/lib/auth/create-admin-user";
import { requireAdmin } from "@/lib/auth/guards";

type ActionState = {
  error?: string;
  success?: boolean;
  adminEmail?: string;
  plainPassword?: string;
};

export async function createAdminAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const result = await createAdminUser({
    firstName: String(formData.get("first_name") ?? ""),
    lastName: String(formData.get("last_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? "").trim() || undefined,
  });

  if (!result.ok) {
    return { error: result.error };
  }

  revalidatePath("/admin/create-admin");
  revalidatePath("/admin/admins");
  return {
    success: true,
    adminEmail: result.email,
    plainPassword: result.password,
  };
}
