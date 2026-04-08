export type UserStatus = 'active' | 'inactive';

export interface UserEntity {
  id: string;
  email: string;
  tenantId: string;
  status: UserStatus;
}
