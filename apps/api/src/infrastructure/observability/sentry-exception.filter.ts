import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { resolveApiLocale, translateApiMessage } from '../../shared/i18n/api-i18n';
import { captureSentryException } from './sentry';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
  override catch(exception: unknown, host: ArgumentsHost) {
    captureSentryException(exception);

    if (host.getType() !== 'http') {
      super.catch(exception, host);
      return;
    }

    const http = host.switchToHttp();
    const req = http.getRequest<{ headers?: Record<string, string | string[] | undefined> }>();
    const res = http.getResponse<{
      status: (code: number) => { json: (body: unknown) => void };
      setHeader?: (name: string, value: string) => void;
    }>();

    const locale = resolveApiLocale(req);
    const contentLanguage = locale === 'zh-CN' ? 'zh-CN' : 'en-US';
    res.setHeader?.('Content-Language', contentLanguage);

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'string') {
        res.status(status).json({
          statusCode: status,
          message: translateApiMessage(response, locale),
        });
        return;
      }

      if (response && typeof response === 'object') {
        const payload = response as {
          statusCode?: number;
          error?: string;
          message?: string | string[];
        };

        const translatedMessage = Array.isArray(payload.message)
          ? payload.message.map((item) => translateApiMessage(item, locale))
          : translateApiMessage(payload.message ?? '', locale);

        res.status(status).json({
          ...payload,
          statusCode: payload.statusCode ?? status,
          message: translatedMessage,
        });
        return;
      }

      res.status(status).json({
        statusCode: status,
        message: translateApiMessage('Internal server error', locale),
      });
      return;
    }

    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: translateApiMessage('Internal server error', locale),
    });
  }
}
