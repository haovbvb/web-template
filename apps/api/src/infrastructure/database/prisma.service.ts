import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if ((process.env.DB_PROVIDER ?? 'postgres') === 'postgres') {
      await this.$connect();
    }
  }

  async onModuleDestroy() {
    if ((process.env.DB_PROVIDER ?? 'postgres') === 'postgres') {
      await this.$disconnect();
    }
  }
}
