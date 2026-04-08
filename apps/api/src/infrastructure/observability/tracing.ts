import { context, SpanStatusCode, trace, type Attributes } from '@opentelemetry/api';
import { BatchSpanProcessor, ConsoleSpanExporter } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

let initialized = false;

export function initTracing() {
  if (initialized) {
    return;
  }

  const spanProcessors = [];
  if ((process.env.OTEL_TRACE_CONSOLE ?? 'true') === 'true') {
    spanProcessors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  const provider = new NodeTracerProvider({
    spanProcessors,
  });

  provider.register();
  initialized = true;
}

export const appTracer = trace.getTracer('enterprise-fullstack-api', '0.1.0');

export async function withSpan<T>(
  name: string,
  attrs: Attributes,
  fn: () => Promise<T>,
): Promise<T> {
  const span = appTracer.startSpan(name, {
    attributes: attrs,
  });

  try {
    return await context.with(trace.setSpan(context.active(), span), fn);
  } catch (error) {
    span.recordException(error as Error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : 'unknown error',
    });
    throw error;
  } finally {
    span.end();
  }
}
