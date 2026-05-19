import { generateTempPassword } from "@/lib/auth/generate-temp-password";
import { requireAdmin } from "@/lib/auth/guards";
import { validateEmail, validatePassword } from "@/lib/auth/validate-credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CreateAdminUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
};

export type CreateAdminUserResult =
  | { ok: true; userId: string; email: string; password: string }
  | { ok: false; error: string };

export async function createAdminUser(
  input: CreateAdminUserInput,
): Promise<CreateAdminUserResult> {
  await requireAdmin();

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password?.trim() || generateTempPassword();

  if (!firstName || !email) {
    return { ok: false, error: "Заполните обязательные поля: имя и email." };
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return { ok: false, error: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, error: passwordError };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: createdUser, error: createError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

  if (createError || !createdUser.user) {
    return { ok: false, error: createError?.message ?? "Не удалось создать пользователя." };
  }

  const userId = createdUser.user.id;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName.length > 0 ? lastName : null,
      email,
      role: "admin",
    })
    .eq("user_id", userId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  return { ok: true, userId, email, password };
}
