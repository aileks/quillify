import bcrypt from 'bcryptjs';

export function normalizePasswordHash(passwordHash: string): string {
  return passwordHash.startsWith('$2y$') ? passwordHash.replace(/^\$2y\$/, '$2b$') : passwordHash;
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, normalizePasswordHash(passwordHash));
}
