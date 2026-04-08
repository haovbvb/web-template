import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { withSpan } from '../infrastructure/observability/tracing';
import { AuthTokens, AuthUser } from '../shared/auth/auth-user';

interface LoginInput {
  email: string;
  password: string;
  tenantId?: string;
}

@Injectable()
export class AuthService {
  private readonly refreshTokenStore = new Map<string, string>();

  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async login(input: LoginInput): Promise<AuthTokens> {
    return withSpan(
      'auth.login',
      {
        'auth.email': input.email ?? '',
        'auth.tenant_id': input.tenantId ?? 'default-tenant',
      },
      async () => {
        if (!input.email || !input.password) {
          throw new UnauthorizedException('email or password is invalid');
        }

        const authUser: AuthUser = {
          sub: input.email,
          email: input.email,
          tenantId: input.tenantId ?? 'default-tenant',
          roles: this.resolveRoles(input.email),
          permissions: this.resolvePermissions(input.email),
        };

        return this.issueTokens(authUser);
      },
    );
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: AuthUser;

    try {
      const decoded = await this.jwtService.verifyAsync<AuthUser & { iat?: number; exp?: number }>(
        refreshToken,
        {
          secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'replace_me',
        },
      );

      payload = {
        sub: decoded.sub,
        email: decoded.email,
        tenantId: decoded.tenantId,
        roles: decoded.roles ?? [],
        permissions: decoded.permissions ?? [],
      };
    } catch {
      throw new UnauthorizedException('refresh token is invalid');
    }

    const tokenInStore = this.refreshTokenStore.get(payload.sub);
    if (!tokenInStore || tokenInStore !== refreshToken) {
      throw new UnauthorizedException('refresh token is expired');
    }

    return this.issueTokens(payload);
  }

  async verifyAccessToken(token: string): Promise<AuthUser> {
    try {
      return await this.jwtService.verifyAsync<AuthUser>(token, {
        secret: process.env.JWT_SECRET ?? 'replace_me',
      });
    } catch {
      throw new UnauthorizedException('access token is invalid');
    }
  }

  private async issueTokens(user: AuthUser): Promise<AuthTokens> {
    const accessExpiresIn = (process.env.JWT_EXPIRES_IN ?? '15m') as JwtSignOptions['expiresIn'];
    const refreshExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ??
      '7d') as JwtSignOptions['expiresIn'];

    const accessToken = await this.jwtService.signAsync(user, {
      secret: process.env.JWT_SECRET ?? 'replace_me',
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(user, {
      secret: process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? 'replace_me',
      expiresIn: refreshExpiresIn,
    });

    this.refreshTokenStore.set(user.sub, refreshToken);

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: accessExpiresIn,
    };
  }

  private resolveRoles(email: string): string[] {
    if (email.endsWith('@admin.local') || email === 'owner@example.com') {
      return ['tenant_admin'];
    }

    return ['tenant_member'];
  }

  private resolvePermissions(email: string): string[] {
    const basePermissions = ['users:read:self'];

    if (email.endsWith('@admin.local') || email === 'owner@example.com') {
      return [...basePermissions, 'users:read:tenant', 'users:admin', 'org:manage'];
    }

    return basePermissions;
  }
}
