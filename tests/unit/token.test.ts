import { describe, expect, it } from 'vitest';

import { createOpaqueToken, hashOpaqueToken } from '@/server/auth/token';

describe('opaque account tokens', () => {
  it('stores only a deterministic hash', () => {
    expect(hashOpaqueToken('raw-token')).toBe(
      '34d328009b123fbbb0dc93f18b3e6de1ecf7b1a5783c33dff7ffe1926f09e943'
    );
  });

  it('generates a raw token and a distinct database hash', () => {
    const token = createOpaqueToken();

    expect(token.rawToken).toHaveLength(64);
    expect(token.tokenHash).toBe(hashOpaqueToken(token.rawToken));
    expect(token.tokenHash).not.toBe(token.rawToken);
  });
});
