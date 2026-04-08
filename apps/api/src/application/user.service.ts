import { Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../domain/user.entity';
import { USER_REPOSITORY, UserRepository } from '../domain/user.repository';
import { AuthUser } from '../shared/auth/auth-user';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
  ) {}

  async listByTenant(tenantId: string): Promise<UserEntity[]> {
    return this.userRepository.listByTenant(tenantId);
  }

  async listVisibleUsers(actor: AuthUser): Promise<UserEntity[]> {
    const tenantUsers = await this.userRepository.listByTenant(actor.tenantId);

    if (actor.permissions.includes('users:read:tenant')) {
      return tenantUsers;
    }

    return tenantUsers.filter((user) => user.email === actor.email);
  }
}
