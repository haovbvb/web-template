import { INestApplication } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../app.module';
import { MongoConnectionService } from '../../infrastructure/database/mongo.connection';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SentryExceptionFilter } from '../../infrastructure/observability/sentry-exception.filter';

let app: INestApplication | undefined;

afterEach(async () => {
  if (app) {
    await app.close();
    app = undefined;
  }
});

describe('Auth login e2e', () => {
  async function bootstrapTestApp(): Promise<INestApplication> {
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
    const { httpAdapter } = app.get(HttpAdapterHost);
    app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
    await app.init();

    return app;
  }

  it('returns access and refresh tokens', async () => {
    const testApp = await bootstrapTestApp();

    const response = await request(testApp.getHttpServer()).post('/auth/login').send({
      email: 'owner@example.com',
      password: 'pass123',
      tenantId: 't1',
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toBeTypeOf('string');
    expect(response.body.refreshToken).toBeTypeOf('string');
  });

  it('returns localized error message for zh-CN', async () => {
    const testApp = await bootstrapTestApp();

    const response = await request(testApp.getHttpServer())
      .post('/auth/login')
      .set('Accept-Language', 'zh-CN')
      .send({
        email: '',
        password: '',
        tenantId: 't1',
      });

    expect(response.status).toBe(401);
    expect(response.headers['content-language']).toBe('zh-CN');
    expect(response.body.message).toBe('邮箱或密码不正确');
  });
});
