import { UserEntity } from './user.entity';

export interface UserRepository {
  listByTenant(tenantId: string): Promise<UserEntity[]>;
}

export const USER_REPOSITORY = 'USER_REPOSITORY';
