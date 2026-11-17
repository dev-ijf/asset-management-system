export const PASSWORD_MIN_LENGTH = 8;
// bcrypt only uses the first 72 bytes of a password.
export const PASSWORD_MAX_LENGTH = 72;

export function validateNewPassword(password: string, confirmation: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password minimal ${PASSWORD_MIN_LENGTH} karakter.`;
  }

  if (new TextEncoder().encode(password).length > PASSWORD_MAX_LENGTH) {
    return `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.`;
  }

  if (password !== confirmation) {
    return "Konfirmasi password tidak sama.";
  }

  return null;
}
