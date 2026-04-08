import { Worker } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

const worker = new Worker(
  'admin-jobs',
  async (job) => {
    if (job.name === 'notification.send') {
      console.log('Sending notification payload:', job.data);
      return { ok: true, channel: 'mock-notification' };
    }

    if (job.name === 'report.export') {
      console.log('Exporting report payload:', job.data);
      return { ok: true, reportUrl: '/reports/mock.csv' };
    }

    console.log('Processing generic job:', job.name, job.id, job.data);
    return { ok: true, handled: 'generic' };
  },
  { connection },
);

worker.on('ready', () => {
  console.log('Admin worker is ready with Redis:', connection);
});

worker.on('failed', (job, error) => {
  console.error('Job failed:', job?.id, error.message);
});
