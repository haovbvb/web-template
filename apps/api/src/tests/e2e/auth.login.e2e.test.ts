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

describe('Auth login e2e', () => {
  it('returns access and refresh tokens', async () => {
    process.env.DB_PROVIDER = 'postgres';

    const prismaMock = {
      user: {
        findMany: async () => [],
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

    const response = await request(app.getHttpServer()).post('/auth/login').send({
      email: 'owner@example.com',
      password: 'pass123',
      tenantId: 't1',
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(response.body.refreshToken).toBeTypeOf('string');
  });
});
