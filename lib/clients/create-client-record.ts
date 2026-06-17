import { CASE_STATUSES } from "@/lib/constants/case-statuses";
import { generateTempPassword } from "@/lib/auth/generate-temp-password";
import { validateEmail, validatePassword } from "@/lib/auth/validate-credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type CreateClientInput = {
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;
  passportNumber?: string;
  formgridRowKey?: string;
  /** Сохранить пароль в cases.initial_password для карточки админа. */
  storeInitialPassword?: boolean;
  /** Пометить карточку как «новый клиент из Formgrid». */
  markAsNewFromFormgrid?: boolean;
};

export type CreateClientResult =
  | { ok: true; userId: string; email: string; plainPassword: string }
  | { ok: false; error: string; code?: "duplicate_email" | "duplicate_row" };

export async function createClientRecord(
  input: CreateClientInput,
): Promise<CreateClientResult> {
  const firstName = input.firstName.trim();
  const lastName = (input.lastName ?? "").trim();
  const email = input.email.trim().toLowerCase();
  const passportNumber = (input.passportNumber ?? "").trim();
  const password = (input.password ?? "").trim() || generateTempPassword();
  const formgridRowKey = (input.formgridRowKey ?? "").trim() || null;

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

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("user_id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    return {
      ok: false,
      error: `Клиент с email ${email} уже существует.`,
      code: "duplicate_email",
    };
  }

  if (formgridRowKey) {
    const { data: existingCase } = await supabaseAdmin
      .from("cases")
      .select("client_id")
      .eq("formgrid_row_key", formgridRowKey)
      .maybeSingle();

    if (existingCase) {
      return {
        ok: false,
        error: "Эта строка таблицы уже импортирована.",
        code: "duplicate_row",
      };
    }
  }

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
      role: "client",
    })
    .eq("user_id", userId);

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: false, error: profileError.message };
  }

  const now = new Date().toISOString();
  const { error: caseError } = await supabaseAdmin.from("cases").insert({
    client_id: userId,
    current_stage: "Первичная обработка",
    current_status: CASE_STATUSES[0],
    status_reached_at: { [CASE_STATUSES[0]]: now },
    case_number: passportNumber.length > 0 ? passportNumber : null,
    initial_password: input.storeInitialPassword ? password : null,
    formgrid_row_key: formgridRowKey,
    is_new_from_formgrid: Boolean(input.markAsNewFromFormgrid),
  });

  if (caseError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { ok: false, error: caseError.message };
  }

  return { ok: true, userId, email, plainPassword: password };
}
