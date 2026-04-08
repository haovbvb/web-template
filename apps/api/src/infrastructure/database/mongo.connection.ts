import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import mongoose, { Connection } from 'mongoose';

@Injectable()
export class MongoConnectionService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    if ((process.env.DB_PROVIDER ?? 'postgres') !== 'mongo') {
      return;
    }

    const mongoUrl = process.env.MONGO_URL ?? 'mongodb://localhost:27017/app';
    await mongoose.connect(mongoUrl);
  }

  async onModuleDestroy() {
    if ((process.env.DB_PROVIDER ?? 'postgres') === 'mongo') {
      await mongoose.disconnect();
    }
  }

  getConnection(): Connection {
    return mongoose.connection;
  }
}
