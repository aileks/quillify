import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

import { normalizePasswordHash, verifyPassword } from '@/server/auth/password';

describe('Laravel password compatibility', () => {
  it('normalizes Laravel bcrypt prefixes without changing the hash body', () => {
    const laravelHash = '$2y$12$abcdefghijklmnopqrstuvwxyz01234567890123456789012';

    expect(normalizePasswordHash(laravelHash)).toBe(
      '$2b$12$abcdefghijklmnopqrstuvwxyz01234567890123456789012'
    );
  });

  it('verifies passwords stored with a Laravel $2y$ prefix', async () => {
    const password = 'QuillifyTest123';
    const nodeHash = await bcrypt.hash(password, 4);
    const laravelHash = nodeHash.replace(/^\$2b\$/, '$2y$');

    await expect(verifyPassword(password, laravelHash)).resolves.toBe(true);
    await expect(verifyPassword('wrong password', laravelHash)).resolves.toBe(false);
  });
});
