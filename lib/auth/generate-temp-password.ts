import { randomBytes } from "node:crypto";

export function generateTempPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(12);
  let value = "";

  for (let index = 0; index < 12; index += 1) {
    value += chars[bytes[index] % chars.length];
  }

  return value;
}
