export interface JwtPayload {
  sub?: string;
  email?: string;
  tenantId?: string;
  roles?: string[];
  permissions?: string[];
  exp?: number;
  iat?: number;
}

function decodeBase64Url(value: string): string {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return atob(padded);
}

export function parseJwt(token: string | null): JwtPayload | null {
  if (!token) {
    return null;
  }

  const segments = token.split('.');
  if (segments.length < 2) {
    return null;
  }

  try {
    const json = decodeBase64Url(segments[1] ?? '');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}
