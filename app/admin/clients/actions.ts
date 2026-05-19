"use server";

import { revalidatePath } from "next/cache";
import { CASE_STATUSES } from "@/lib/constants/case-statuses";
import { STATUS_SUBMISSION_DETAILS } from "@/lib/constants/case-status-utils";
import { generateTempPassword } from "@/lib/auth/generate-temp-password";
import { requireAdmin } from "@/lib/auth/guards";
import { validateEmail, validatePassword } from "@/lib/auth/validate-credentials";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mergeStatusReachedAt } from "@/lib/cases/status-stage-dates";
import { formatBrevoRequestError } from "@/lib/email/brevo-fetch";
import { sendCaseStatusEmail } from "@/lib/email/send-case-status-email";

type ActionState = {
  error?: string;
  success?: boolean;
  emailWarning?: string;
  clientEmail?: string;
  plainPassword?: string;
};

export async function createClientAction(_prevState: ActionState, formData: FormData) {
  await requireAdmin();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const manualPassword = String(formData.get("password") ?? "").trim();
  const passportNumber = String(formData.get("passport_number") ?? "").trim();
  const password = manualPassword || generateTempPassword();

  if (!firstName || !email) {
    return { error: "Заполните обязательные поля: имя и email." };
  }

  const emailError = validateEmail(email);
  if (emailError) {
    return { error: emailError };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { error: passwordError };
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
    return { error: createError?.message ?? "Не удалось создать пользователя." };
  }

  const userId = createdUser.user.id;

  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      role: "client",
    })
    .eq("user_id", userId);

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { error: profileError.message };
  }

  const now = new Date().toISOString();
  const { error: caseError } = await supabaseAdmin.from("cases").insert({
    client_id: userId,
    current_stage: "Первичная обработка",
    current_status: CASE_STATUSES[0],
    status_reached_at: { [CASE_STATUSES[0]]: now },
    case_number: passportNumber.length > 0 ? passportNumber : null,
  });

  if (caseError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return { error: caseError.message };
  }

  revalidatePath("/admin/clients");
  return { success: true, clientEmail: email, plainPassword: password };
}

type ResetClientPasswordState = {
  error?: string;
  newPassword?: string;
};

export async function resetClientPasswordAction(
  clientId: string,
  _prevState: ResetClientPasswordState,
  _formData: FormData,
): Promise<ResetClientPasswordState> {
  await requireAdmin();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", clientId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "client") {
    return { error: "Клиент не найден." };
  }

  const newPassword = generateTempPassword();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(clientId, {
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { newPassword };
}

export async function updateClientCaseAction(
  clientId: string,
  _prevState: ActionState,
  formData: FormData,
) {
  await requireAdmin();

  const currentStatus = String(formData.get("current_status") ?? "").trim();
  const submissionDate = String(formData.get("submission_date") ?? "").trim() || null;
  const submissionCity = String(formData.get("submission_city") ?? "").trim() || null;
  const caseNumber = String(formData.get("case_number") ?? "").trim() || null;
  const consulate = String(formData.get("consulate") ?? "").trim() || null;
  const internalComment = String(formData.get("internal_comment") ?? "").trim() || null;
  const curatorCommentForClient =
    String(formData.get("curator_comment_for_client") ?? "").trim() || null;
  if (!CASE_STATUSES.includes(currentStatus as (typeof CASE_STATUSES)[number])) {
    return { error: "Некорректный статус." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: existingCase, error: existingCaseError } = await supabaseAdmin
    .from("cases")
    .select("current_status, status_reached_at")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existingCaseError) {
    return { error: existingCaseError.message };
  }

  if (!existingCase) {
    return { error: "Дело клиента не найдено. Создайте клиента заново или обратитесь в поддержку." };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, first_name, last_name")
    .eq("user_id", clientId)
    .single();

  if (profileError) {
    return { error: profileError.message };
  }

  const previousStatus = existingCase?.current_status ?? null;
  const isStatusChanged = previousStatus !== currentStatus;
  const filingActive = currentStatus === STATUS_SUBMISSION_DETAILS;

  const updatePayload: Record<string, unknown> = {
    current_status: currentStatus,
    status_updated_at: new Date().toISOString(),
    internal_comment: internalComment,
    curator_comment_for_client: curatorCommentForClient,
  };

  if (isStatusChanged) {
    updatePayload.status_reached_at = mergeStatusReachedAt(
      existingCase?.status_reached_at,
      currentStatus,
      true,
    );
  }

  if (filingActive) {
    updatePayload.submission_date = submissionDate;
    updatePayload.submission_city = submissionCity;
    updatePayload.case_number = caseNumber;
    updatePayload.consulate = consulate;
  }

  const { error } = await supabaseAdmin
    .from("cases")
    .update(updatePayload)
    .eq("client_id", clientId);

  if (error) {
    return { error: error.message };
  }

  const clientEmail = profile?.email?.trim();
  const hasBrevoKey = Boolean(process.env.BREVO_API_KEY?.trim());
  let emailWarning: string | undefined;

  if (isStatusChanged && clientEmail && hasBrevoKey) {
    const clientName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");

    try {
      await sendCaseStatusEmail({
        to: clientEmail,
        clientName: clientName || undefined,
        oldStatus: previousStatus ?? undefined,
        newStatus: currentStatus,
      });
    } catch (error) {
      emailWarning = `Статус сохранён, но письмо клиенту не отправлено: ${formatBrevoRequestError(error)}`;
    }
  } else if (isStatusChanged && clientEmail && !hasBrevoKey) {
    emailWarning =
      "Статус сохранён. Письмо не отправлено: не задан BREVO_API_KEY на сервере.";
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { success: true, emailWarning };
}

export type UpdateClientIdentityState = { error?: string; success?: boolean };

export async function updateClientIdentityAction(
  clientId: string,
  _prevState: UpdateClientIdentityState,
  formData: FormData,
): Promise<UpdateClientIdentityState> {
  await requireAdmin();

  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const passportNumber = String(formData.get("passport_number") ?? "").trim();

  if (!firstName || !email) {
    return { error: "Заполните имя и email." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Укажите корректный email." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, role")
    .eq("user_id", clientId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "client") {
    return { error: "Клиент не найден." };
  }

  const oldEmail = (profile.email ?? "").trim().toLowerCase();
  const authPayload: {
    email?: string;
    email_confirm?: boolean;
    user_metadata: { first_name: string; last_name: string };
  } = {
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  };
  if (email !== oldEmail) {
    authPayload.email = email;
    authPayload.email_confirm = true;
  }

  const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(clientId, authPayload);
  if (authError) {
    return { error: authError.message };
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from("profiles")
    .update({
      first_name: firstName,
      last_name: lastName.length > 0 ? lastName : null,
      email,
    })
    .eq("user_id", clientId);

  if (profileUpdateError) {
    return { error: profileUpdateError.message };
  }

  const { error: caseUpdateError } = await supabaseAdmin
    .from("cases")
    .update({
      case_number: passportNumber.length > 0 ? passportNumber : null,
    })
    .eq("client_id", clientId);

  if (caseUpdateError) {
    return { error: caseUpdateError.message };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/dashboard");
  return { success: true };
}

export type DeleteClientResult = { error?: string; success?: true };

export async function deleteClientAction(clientId: string): Promise<DeleteClientResult> {
  const { user } = await requireAdmin();

  if (user.id === clientId) {
    return { error: "Нельзя удалить собственный аккаунт из карточки клиента." };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", clientId)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "client") {
    return { error: "Клиент не найден или уже удалён." };
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(clientId);
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${clientId}`);
  return { success: true };
}
