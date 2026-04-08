import { UserRepository } from '../../domain/user.repository';
import { MongoConnectionService } from '../database/mongo.connection';
import { PrismaService } from '../database/prisma.service';
import { MongoUserRepository } from './mongo-user.repository';
import { PostgresUserRepository } from './postgres-user.repository';

export function buildUserRepository(
  provider: string | undefined,
  prisma: PrismaService,
  mongo: MongoConnectionService,
): UserRepository {
  if (provider === 'mongo') {
    return new MongoUserRepository(mongo);
  }

  return new PostgresUserRepository(prisma);
}
