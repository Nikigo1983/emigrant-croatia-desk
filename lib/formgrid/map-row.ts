import { FORMGRID_SHEET_COLUMNS } from "@/lib/formgrid/column-config";

export type FormgridClientRow = {
  firstName: string;
  lastName: string;
  email: string;
  passportNumber: string;
};

const DEFAULT_ALIASES = {
  fullName: [
    FORMGRID_SHEET_COLUMNS.fullNameCyrillic,
    "фамилия, имя, отчество",
    "фио",
    "имя",
    "first name",
    "name",
  ],
  firstName: ["имя", "first name", "first_name", "ваше имя"],
  lastName: ["фамилия", "last name", "last_name", "surname", "ваша фамилия"],
  email: [
    FORMGRID_SHEET_COLUMNS.email,
    "email",
    "e-mail",
    "почта",
    "эл. почта",
    "электронная почта",
    "электронный адрес",
    "e mail",
  ],
  passport: [
    FORMGRID_SHEET_COLUMNS.passport,
    "номер паспорта",
    "паспорт",
    "passport",
    "passport number",
    "заграничного паспорта",
    "номер загранпаспорта",
  ],
} as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function findColumnIndex(headers: string[], aliases: readonly string[]) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const normalizedAliases = aliases.map(normalizeHeader);

  for (let index = 0; index < normalizedHeaders.length; index += 1) {
    const header = normalizedHeaders[index];
    if (normalizedAliases.includes(header)) {
      return index;
    }
  }

  for (let index = 0; index < normalizedHeaders.length; index += 1) {
    const header = normalizedHeaders[index];
    if (normalizedAliases.some((alias) => header.includes(alias) || alias.includes(header))) {
      return index;
    }
  }

  return -1;
}

function envColumnIndex(headers: string[], envName: string): number | null {
  const configured = process.env[envName]?.trim();
  if (!configured) {
    return null;
  }
  const target = normalizeHeader(configured);
  const index = headers.findIndex((header) => normalizeHeader(header) === target);
  return index >= 0 ? index : null;
}

function cellValue(row: string[], index: number) {
  if (index < 0) {
    return "";
  }
  return String(row[index] ?? "").trim();
}

/** «ФАМИЛИЯ ИМЯ ОТЧЕСТВО» → имя + фамилия для карточки (как в списке клиентов). */
export function parseRussianFio(value: string): { firstName: string; lastName: string } {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: "", lastName: "" };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" };
  }
  return {
    lastName: parts[0],
    firstName: parts[1],
  };
}

export function mapSheetRowToClient(
  headers: string[],
  row: string[],
): FormgridClientRow | null {
  const fullNameIndex =
    envColumnIndex(headers, "FORMGRID_COLUMN_FULL_NAME") ??
    findColumnIndex(headers, DEFAULT_ALIASES.fullName);
  const firstNameIndex =
    envColumnIndex(headers, "FORMGRID_COLUMN_FIRST_NAME") ??
    findColumnIndex(headers, DEFAULT_ALIASES.firstName);
  const lastNameIndex =
    envColumnIndex(headers, "FORMGRID_COLUMN_LAST_NAME") ??
    findColumnIndex(headers, DEFAULT_ALIASES.lastName);
  const emailIndex =
    envColumnIndex(headers, "FORMGRID_COLUMN_EMAIL") ??
    findColumnIndex(headers, DEFAULT_ALIASES.email);
  const passportIndex =
    envColumnIndex(headers, "FORMGRID_COLUMN_PASSPORT") ??
    findColumnIndex(headers, DEFAULT_ALIASES.passport);

  const email = cellValue(row, emailIndex).toLowerCase();
  const passportNumber = cellValue(row, passportIndex);

  let firstName = "";
  let lastName = "";

  const fullName = cellValue(row, fullNameIndex);
  if (fullName) {
    const parsed = parseRussianFio(fullName);
    firstName = parsed.firstName;
    lastName = parsed.lastName;
  } else {
    firstName = cellValue(row, firstNameIndex);
    lastName = cellValue(row, lastNameIndex);
  }

  if (!email) {
    return null;
  }

  if (!firstName && !lastName) {
    return null;
  }

  return {
    firstName: firstName || lastName,
    lastName: firstName ? lastName : "",
    email,
    passportNumber,
  };
}

export function isRowEmpty(row: string[]) {
  return row.every((cell) => !String(cell ?? "").trim());
}
