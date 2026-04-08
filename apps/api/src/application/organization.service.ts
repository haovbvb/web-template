import { Injectable } from '@nestjs/common';
import {
    PermissionEntity,
    RoleEntity,
    TeamEntity,
    TenantEntity,
} from '../domain/organization.entity';

interface CreateTenantInput {
  id: string;
  name: string;
  plan?: 'community' | 'pro' | 'enterprise';
}

interface CreateTeamInput {
  id: string;
  tenantId: string;
  name: string;
}

interface CreateRoleInput {
  id: string;
  tenantId: string;
  name: string;
  permissions: string[];
}

interface AssignRoleInput {
  userId: string;
  roleId: string;
}

@Injectable()
export class OrganizationService {
  private readonly tenants = new Map<string, TenantEntity>();
  private readonly teams = new Map<string, TeamEntity>();
  private readonly roles = new Map<string, RoleEntity>();
  private readonly roleAssignments = new Map<string, string[]>();

  readonly permissions: PermissionEntity[] = [
    { key: 'users:read:self', description: 'Read own profile data' },
    { key: 'users:read:tenant', description: 'Read tenant users' },
    { key: 'users:admin', description: 'Manage user and role data' },
    { key: 'org:manage', description: 'Manage tenant/team/role model' },
  ];

  constructor() {
    this.bootstrap();
  }

  listTenants(): TenantEntity[] {
    return [...this.tenants.values()];
  }

  createTenant(input: CreateTenantInput): TenantEntity {
    const item: TenantEntity = {
      id: input.id,
      name: input.name,
      plan: input.plan ?? 'community',
    };

    this.tenants.set(item.id, item);
    return item;
  }

  listTeams(tenantId: string): TeamEntity[] {
    return [...this.teams.values()].filter((team) => team.tenantId === tenantId);
  }

  createTeam(input: CreateTeamInput): TeamEntity {
    const item: TeamEntity = {
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      memberIds: [],
    };

    this.teams.set(item.id, item);
    return item;
  }

  listRoles(tenantId: string): RoleEntity[] {
    return [...this.roles.values()].filter((role) => role.tenantId === tenantId);
  }

  createRole(input: CreateRoleInput): RoleEntity {
    const item: RoleEntity = {
      id: input.id,
      tenantId: input.tenantId,
      name: input.name,
      permissions: input.permissions,
    };

    this.roles.set(item.id, item);
    return item;
  }

  assignRole(input: AssignRoleInput): { userId: string; roleIds: string[] } {
    const roleIds = this.roleAssignments.get(input.userId) ?? [];
    if (!roleIds.includes(input.roleId)) {
      roleIds.push(input.roleId);
    }

    this.roleAssignments.set(input.userId, roleIds);

    return {
      userId: input.userId,
      roleIds,
    };
  }

  private bootstrap() {
    this.createTenant({ id: 't1', name: 'Default Tenant', plan: 'community' });
    this.createRole({
      id: 'role-tenant-admin',
      tenantId: 't1',
      name: 'tenant_admin',
      permissions: ['users:read:self', 'users:read:tenant', 'users:admin', 'org:manage'],
    });
    this.createRole({
      id: 'role-tenant-member',
      tenantId: 't1',
      name: 'tenant_member',
      permissions: ['users:read:self'],
    });
    this.createTeam({ id: 'team-default', tenantId: 't1', name: 'Default Team' });
  }
}
