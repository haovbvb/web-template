import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('org:manage')
export class AuditController {
  constructor(@Inject(AuditService) private readonly auditService: AuditService) {}

  @Get('entries')
  list(@CurrentTenant() tenantId: string) {
    return this.auditService.list(tenantId);
  }
}
