/** Текст приветствия для кабинета клиента: только имя (фамилия не показывается). */
export function profileGreeting(firstName: string | null, lastName: string | null): string {
  const first = firstName?.trim() ?? "";
  if (first) {
    return `Здравствуйте, ${first}`;
  }
  const last = lastName?.trim() ?? "";
  if (last) {
    return `Здравствуйте, ${last}`;
  }
  return "Здравствуйте";
}

/** Приветствие только по имени (для админской главной). */
export function profileGreetingFirstName(firstName: string | null): string {
  return profileGreeting(firstName, null);
}
