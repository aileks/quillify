export function getSafeCallbackUrl(callbackUrl: string | undefined): string {
  if (!callbackUrl?.startsWith('/') || callbackUrl.startsWith('//') || callbackUrl.includes('\\')) {
    return '/';
  }

  return callbackUrl;
}
