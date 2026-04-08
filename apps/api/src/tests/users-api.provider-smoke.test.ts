import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { MongoConnectionService } from '../infrastructure/database/mongo.connection';
import { PrismaService } from '../infrastructure/database/prisma.service';

let app: INestApplication | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('Users API provider smoke', () => {
  it('returns postgres-backed response for /users in postgres mode', async () => {
    process.env.DB_PROVIDER = 'postgres';

    const prismaMock = {
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

    const mongoMock = {
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

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(MongoConnectionService)
      .useValue(mongoMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer()).get('/users').query({ tenantId: 't1' });

    expect(response.status).toBe(200);
    expect(response.body.dbProvider).toBe('postgres');
    expect(response.body.items).toEqual([
      {
        id: 'pg-1',
        email: 'owner@postgres.local',
        tenantId: 't1',
        status: 'active',
      },
    ]);
  });

  it('returns mongo-backed response for /users in mongo mode', async () => {
    process.env.DB_PROVIDER = 'mongo';

    const prismaMock = {
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

    const mongoMock = {
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

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(MongoConnectionService)
      .useValue(mongoMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const response = await request(app.getHttpServer()).get('/users').query({ tenantId: 't1' });

    expect(response.status).toBe(200);
    expect(response.body.dbProvider).toBe('mongo');
    expect(response.body.items).toEqual([
      {
        id: 'mongo-1',
        email: 'owner@mongo.local',
        tenantId: 't1',
        status: 'active',
      },
    ]);
  });
});
