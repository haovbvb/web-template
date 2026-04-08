import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { OpenPlatformService } from '../../application/open-platform.service';

interface ApiKeyRequest {
  headers?: Record<string, string | string[] | undefined>;
  method: string;
  originalUrl?: string;
  path?: string;
  body?: unknown;
  apiClient?: {
    tenantId: string;
    keyId: string;
  };
}

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(OpenPlatformService)
    private readonly openPlatformService: OpenPlatformService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<ApiKeyRequest>();
    const apiKey = this.readHeader(req, 'x-api-key');
    const timestamp = this.readHeader(req, 'x-api-timestamp');
    const signature = this.readHeader(req, 'x-api-signature');
    const path = (req.originalUrl ?? req.path ?? '').split('?')[0] ?? '';
    const body = JSON.stringify(req.body ?? {});

    if (!apiKey || !timestamp || !signature) {
      throw new UnauthorizedException('missing api key headers');
    }

    const result = this.openPlatformService.verifySignature({
      apiKey,
      timestamp,
      signature,
      method: req.method,
      path,
      body,
    });

    this.openPlatformService.recordCallLog({
      tenantId: result.tenantId ?? 'unknown',
      keyId: result.keyId,
      method: req.method,
      path,
      success: result.ok,
      reason: result.reason,
    });

    if (!result.ok || !result.tenantId || !result.keyId) {
      throw new UnauthorizedException(result.reason ?? 'invalid api signature');
    }

    req.apiClient = {
      tenantId: result.tenantId,
      keyId: result.keyId,
    };

    return true;
  }

  private readHeader(req: ApiKeyRequest, key: string): string {
    const value = req.headers?.[key];
    if (Array.isArray(value)) {
      return value[0] ?? '';
    }

    return value ?? '';
  }
}
