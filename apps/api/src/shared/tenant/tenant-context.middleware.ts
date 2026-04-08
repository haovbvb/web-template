import { Injectable, NestMiddleware } from '@nestjs/common';

interface TenantAwareRequest {
  tenantId?: string;
  headers?: Record<string, string | string[] | undefined>;
}

type NextFunction = () => void;

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: TenantAwareRequest, _res: unknown, next: NextFunction) {
    const tenantHeader = req.headers?.['x-tenant-id'];
    if (Array.isArray(tenantHeader)) {
      req.tenantId = tenantHeader[0] ?? 'default-tenant';
    } else {
      req.tenantId = tenantHeader ?? 'default-tenant';
    }

    next();
  }
}
