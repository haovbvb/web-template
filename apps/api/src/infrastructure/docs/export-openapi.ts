import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { AppModule } from '../../app.module';

async function run() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise Fullstack API')
    .setDescription('API docs for auth, users, tenant, and organization modules')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  const targetPath = resolve(process.cwd(), '../../packages/sdk/openapi.json');
  await mkdir(dirname(targetPath), { recursive: true });
  await writeFile(targetPath, JSON.stringify(document, null, 2), 'utf8');

  await app.close();
  console.log(`OpenAPI spec exported to ${targetPath}`);
}

void run();
