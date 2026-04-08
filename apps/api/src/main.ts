import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import { AppModule } from './app.module';
import { initMetrics, setupMetricsEndpoint } from './infrastructure/observability/metrics';
import { initSentry } from './infrastructure/observability/sentry';
import { SentryExceptionFilter } from './infrastructure/observability/sentry-exception.filter';
import { initTracing } from './infrastructure/observability/tracing';

initSentry();
initTracing();
initMetrics();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));
  setupMetricsEndpoint(app);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Fullstack API')
    .setDescription('API docs for auth, users, tenant, and organization modules')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
  console.log(`API is running on http://localhost:${port}`);
  console.log(`API docs is running on http://localhost:${port}/api-docs`);
}

void bootstrap();
