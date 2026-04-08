import { createParamDecorator, ExecutionContext } from '@nestjs/common';

interface TenantAwareRequest {
  tenantId?: string;
  user?: { tenantId?: string };
  headers?: Record<string, string | string[] | undefined>;
}

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest<TenantAwareRequest>();

    if (req.user?.tenantId) {
      return req.user.tenantId;
    }

    if (req.tenantId) {
      return req.tenantId;
    }

    const tenantHeader = req.headers?.['x-tenant-id'];
    if (Array.isArray(tenantHeader)) {
      return tenantHeader[0] ?? 'default-tenant';
    }

    return tenantHeader ?? 'default-tenant';
  },
);
