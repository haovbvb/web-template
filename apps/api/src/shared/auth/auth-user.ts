export interface AuthUser {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn?: string | number;
}
