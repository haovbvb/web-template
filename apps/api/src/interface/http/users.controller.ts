import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import { UserService } from '../../application/user.service';
import { AuthUser } from '../../shared/auth/auth-user';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

interface AuthenticatedRequest {
  user: AuthUser;
}

@Controller('users')
export class UsersController {
  constructor(@Inject(UserService) private readonly userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('tenant')
  @UseGuards(JwtAuthGuard)
  async tenantUsers(@CurrentTenant() tenantId: string) {
    const items = await this.userService.listByTenant(tenantId);
    return {
      tenantId,
      items,
    };
  }

  @Get('visible')
  @UseGuards(JwtAuthGuard)
  async visibleUsers(@Req() req: AuthenticatedRequest) {
    const items = await this.userService.listVisibleUsers(req.user);
    return {
      scope: req.user.permissions.includes('users:read:tenant') ? 'tenant' : 'self',
      items,
    };
  }

  @Get('admin-overview')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermissions('users:admin')
  adminOverview(@Req() req: AuthenticatedRequest) {
    return {
      message: 'admin route granted',
      tenantId: req.user.tenantId,
      roles: req.user.roles,
      permissions: req.user.permissions,
    };
  }

  @Get()
  async list(@Query('tenantId') tenantId = 'default-tenant') {
    const items = await this.userService.listByTenant(tenantId);
    return {
      dbProvider: process.env.DB_PROVIDER ?? 'postgres',
      items,
    };
  }
}
