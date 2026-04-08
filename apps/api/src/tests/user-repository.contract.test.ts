import { describe, expect, it } from 'vitest';
import { MongoConnectionService } from '../infrastructure/database/mongo.connection';
import { PrismaService } from '../infrastructure/database/prisma.service';
import { MongoUserRepository } from '../infrastructure/repositories/mongo-user.repository';
import { PostgresUserRepository } from '../infrastructure/repositories/postgres-user.repository';
import { buildUserRepository } from '../infrastructure/repositories/user.repository.factory';

describe('UserRepository contract', () => {
  it('uses postgres repository by default', async () => {
    const prisma = {
      user: {
        findMany: async () => [
          {
            id: 'pg-1',
            email: 'owner@postgres.local',
            tenantId: 't1',
            status: 'active',
            createdAt: new Date(),
          },
        ],
      },
    } as unknown as PrismaService;

    const mongo = {
      getConnection: () => ({
        models: {},
        model: () => ({
          find: () => ({
            sort: () => ({
              lean: async () => [],
            }),
          }),
        }),
      }),
    } as unknown as MongoConnectionService;

    const repo = buildUserRepository(undefined, prisma, mongo);
    expect(repo).toBeInstanceOf(PostgresUserRepository);

    const rows = await repo.listByTenant('t1');
    expect(rows).toEqual([
      {
        id: 'pg-1',
        email: 'owner@postgres.local',
        tenantId: 't1',
        status: 'active',
      },
    ]);
  });

  it('uses mongo repository when DB_PROVIDER is mongo', async () => {
    const prisma = {
      user: {
        findMany: async () => [],
      },
    } as unknown as PrismaService;

    const mongoRows = [
      {
        _id: 'mongo-1',
        email: 'owner@mongo.local',
        tenantId: 't1',
        status: 'active',
      },
    ];

    const mongo = {
      getConnection: () => ({
        models: {
          User: {
            find: () => ({
              sort: () => ({
                lean: async () => mongoRows,
              }),
            }),
          },
        },
        model: () => ({
          find: () => ({
            sort: () => ({
              lean: async () => mongoRows,
            }),
          }),
        }),
      }),
    } as unknown as MongoConnectionService;

    const repo = buildUserRepository('mongo', prisma, mongo);
    expect(repo).toBeInstanceOf(MongoUserRepository);

    const rows = await repo.listByTenant('t1');
    expect(rows).toEqual([
      {
        id: 'mongo-1',
        email: 'owner@mongo.local',
        tenantId: 't1',
        status: 'active',
      },
    ]);
  });
});
