/**
 * Maximum lengths of free-text fields. Shared by forms (`maxLength`) and server validation,
 * so a long value is stopped while typing and still rejected if it reaches the server another way.
 */
export const TEXT_LIMITS = {
  code: 30,
  name: 100,
  email: 254,
  phone: 30,
  reference: 50,
  description: 500,
} as const;

export function tooLongMessage(label: string, max: number) {
  return `${label} maksimal ${max} karakter.`;
}

/** Sets a "maksimal N karakter" error on each field whose value is too long and has no other error yet. */
export function checkLengths(
  errors: Record<string, string | undefined>,
  checks: Array<[field: string, label: string, value: string, max: number]>,
) {
  for (const [field, label, value, max] of checks) {
    if (!errors[field] && value.length > max) errors[field] = tooLongMessage(label, max);
  }
}
