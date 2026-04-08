import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { OrganizationService } from '../../application/organization.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

interface CreateTenantRequest {
  id: string;
  name: string;
  plan?: 'community' | 'pro' | 'enterprise';
}

interface CreateTeamRequest {
  id: string;
  name: string;
}

interface CreateRoleRequest {
  id: string;
  name: string;
  permissions: string[];
}

interface AssignRoleRequest {
  userId: string;
  roleId: string;
}

@Controller('org')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('org:manage')
export class OrganizationController {
  constructor(
    @Inject(OrganizationService)
    private readonly organizationService: OrganizationService,
  ) {}

  @Get('permissions')
  permissions() {
    return this.organizationService.permissions;
  }

  @Get('tenants')
  tenants() {
    return this.organizationService.listTenants();
  }

  @Post('tenants')
  createTenant(@Body() body: CreateTenantRequest) {
    return this.organizationService.createTenant(body);
  }

  @Get('teams')
  teams(@CurrentTenant() tenantId: string) {
    return this.organizationService.listTeams(tenantId);
  }

  @Post('teams')
  createTeam(@CurrentTenant() tenantId: string, @Body() body: CreateTeamRequest) {
    return this.organizationService.createTeam({
      id: body.id,
      tenantId,
      name: body.name,
    });
  }

  @Get('roles')
  roles(@CurrentTenant() tenantId: string) {
    return this.organizationService.listRoles(tenantId);
  }

  @Post('roles')
  createRole(@CurrentTenant() tenantId: string, @Body() body: CreateRoleRequest) {
    return this.organizationService.createRole({
      id: body.id,
      tenantId,
      name: body.name,
      permissions: body.permissions,
    });
  }

  @Post('roles/assign')
  assignRole(@Body() body: AssignRoleRequest) {
    return this.organizationService.assignRole(body);
  }
}
