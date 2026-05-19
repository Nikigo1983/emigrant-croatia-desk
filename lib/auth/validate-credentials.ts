export function validateEmail(email: string): string | null {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    return "Укажите email.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Укажите корректный email.";
  }
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Пароль должен быть не короче 8 символов.";
  }
  return null;
}
