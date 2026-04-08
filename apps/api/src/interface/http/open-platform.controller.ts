import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { OpenPlatformService } from '../../application/open-platform.service';
import { ApiKeyGuard } from '../../shared/auth/api-key.guard';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

interface CreateApiKeyRequest {
  name: string;
}

interface ApiClientRequest {
  apiClient?: {
    tenantId: string;
    keyId: string;
  };
}

@Controller('open-platform')
export class OpenPlatformController {
  constructor(
    @Inject(OpenPlatformService)
    private readonly openPlatformService: OpenPlatformService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Post('keys')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('org:manage')
  createKey(@CurrentTenant() tenantId: string, @Body() body: CreateApiKeyRequest) {
    const key = this.openPlatformService.createApiKey(tenantId, body.name || 'default-key');

    this.auditService.record({
      action: 'open_platform.api_key.create',
      actor: 'system',
      tenantId,
      detail: {
        keyId: key.id,
        keyName: key.name,
      },
    });

    return key;
  }

  @Get('keys')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('org:manage')
  listKeys(@CurrentTenant() tenantId: string) {
    return this.openPlatformService.listApiKeys(tenantId);
  }

  @Get('call-logs')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('org:manage')
  listCallLogs(@CurrentTenant() tenantId: string) {
    return this.openPlatformService.listCallLogs(tenantId);
  }

  @Post('public/echo')
  @UseGuards(ApiKeyGuard)
  publicEcho(@Req() req: ApiClientRequest, @Body() body: Record<string, unknown>) {
    return {
      ok: true,
      tenantId: req.apiClient?.tenantId,
      keyId: req.apiClient?.keyId,
      echo: body,
    };
  }
}
