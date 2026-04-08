import { UserEntity } from '../../domain/user.entity';
import { UserRepository } from '../../domain/user.repository';
import { PrismaService } from '../database/prisma.service';

export class PostgresUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByTenant(tenantId: string): Promise<UserEntity[]> {
    const rows = await this.prisma.user.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => ({
      id: row.id,
      email: row.email,
      tenantId: row.tenantId,
      status: row.status === 'active' ? 'active' : 'inactive',
    }));
  }
}
