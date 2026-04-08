import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { MongoConnectionService } from '../../infrastructure/database/mongo.connection';
import { PrismaService } from '../../infrastructure/database/prisma.service';

let app: INestApplication | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('Users provider integration', () => {
  it('returns tenant users in postgres mode', async () => {
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
    expect(response.body.items).toHaveLength(1);
  });
});
