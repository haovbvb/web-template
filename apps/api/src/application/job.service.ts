import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

export interface EnqueueJobInput {
  name: 'notification.send' | 'report.export';
  payload: Record<string, unknown>;
}

@Injectable()
export class JobService implements OnModuleDestroy {
  private redis: IORedis | null = null;
  private queue: Queue | null = null;

  private getQueue() {
    if (this.queue) {
      return this.queue;
    }

    this.redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });

    this.queue = new Queue('admin-jobs', {
      connection: this.redis,
    });

    return this.queue;
  }

  async enqueue(input: EnqueueJobInput) {
    const queue = this.getQueue();
    return queue.add(input.name, input.payload, {
      removeOnComplete: true,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async onModuleDestroy() {
    if (this.queue) {
      await this.queue.close();
    }

    if (this.redis) {
      await this.redis.quit();
    }
  }
}
