import { createHash, randomBytes } from 'node:crypto';

export function hashOpaqueToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export function createOpaqueToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString('hex');

  return {
    rawToken,
    tokenHash: hashOpaqueToken(rawToken),
  };
}
