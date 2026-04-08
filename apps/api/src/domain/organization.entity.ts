export interface PermissionEntity {
  key: string;
  description: string;
}

export interface RoleEntity {
  id: string;
  tenantId: string;
  name: string;
  permissions: string[];
}

export interface TeamEntity {
  id: string;
  tenantId: string;
  name: string;
  memberIds: string[];
}

export interface TenantEntity {
  id: string;
  name: string;
  plan: 'community' | 'pro' | 'enterprise';
}
