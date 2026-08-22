import { createHash, randomBytes } from 'node:crypto';

export function hashOpaqueToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

export interface OpaqueToken {
  rawToken: string;
  tokenHash: string;
}

export function createOpaqueToken(): OpaqueToken {
  const rawToken = randomBytes(32).toString('hex');

  return {
    rawToken,
    tokenHash: hashOpaqueToken(rawToken),
  };
}
