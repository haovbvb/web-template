import { INestApplication } from '@nestjs/common';
import { Counter, Histogram, Registry, collectDefaultMetrics, contentType } from 'prom-client';

let initialized = false;
const registry = new Registry();

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registry],
});

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

export function initMetrics() {
  if (initialized) {
    return;
  }

  collectDefaultMetrics({
    register: registry,
    prefix: 'app_',
  });

  initialized = true;
}

export function setupMetricsEndpoint(app: INestApplication) {
  const expressApp = app.getHttpAdapter().getInstance();

  expressApp.use(
    (
      req: { method: string; path: string },
      res: { on: (event: string, cb: () => void) => void; statusCode: number },
      next: () => void,
    ) => {
      const startedAt = process.hrtime.bigint();

      res.on('finish', () => {
        const endedAt = process.hrtime.bigint();
        const durationSeconds = Number(endedAt - startedAt) / 1_000_000_000;
        const route = req.path || 'unknown';
        const statusCode = String(res.statusCode);

        if (route === '/metrics') {
          return;
        }

        httpRequestsTotal.inc({
          method: req.method,
          route,
          status_code: statusCode,
        });

        httpRequestDurationSeconds.observe(
          {
            method: req.method,
            route,
            status_code: statusCode,
          },
          durationSeconds,
        );
      });

      next();
    },
  );

  expressApp.get(
    '/metrics',
    async (
      _req: unknown,
      res: { setHeader: (k: string, v: string) => void; end: (body: string) => void },
    ) => {
      res.setHeader('Content-Type', contentType);
      res.end(await registry.metrics());
    },
  );
}
