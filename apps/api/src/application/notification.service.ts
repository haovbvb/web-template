import { Injectable } from '@nestjs/common';
import { withSpan } from '../infrastructure/observability/tracing';
import { maskEmail } from '../shared/security/data-security';

export type NotificationChannel = 'email' | 'sms' | 'inapp';

export interface SendNotificationInput {
  channel: NotificationChannel;
  to: string;
  content: string;
  title?: string;
  tenantId: string;
  meta?: Record<string, unknown>;
}

export interface NotificationReceipt {
  id: string;
  tenantId: string;
  channel: NotificationChannel;
  to: string;
  toMasked: string;
  title?: string;
  content: string;
  providerMessageId: string;
  createdAt: string;
}

interface NotificationChannelAdapter {
  send(input: SendNotificationInput): Promise<{ providerMessageId: string }>;
}

class EmailAdapter implements NotificationChannelAdapter {
  async send(input: SendNotificationInput): Promise<{ providerMessageId: string }> {
    const providerMessageId = `mail-${Date.now()}`;
    console.log('[notification][email]', {
      to: input.to,
      title: input.title,
      content: input.content,
      providerMessageId,
    });
    return { providerMessageId };
  }
}

class SmsAdapter implements NotificationChannelAdapter {
  async send(input: SendNotificationInput): Promise<{ providerMessageId: string }> {
    const providerMessageId = `sms-${Date.now()}`;
    console.log('[notification][sms]', {
      to: input.to,
      content: input.content,
      providerMessageId,
    });
    return { providerMessageId };
  }
}

class InAppAdapter implements NotificationChannelAdapter {
  async send(input: SendNotificationInput): Promise<{ providerMessageId: string }> {
    const providerMessageId = `inapp-${Date.now()}`;
    console.log('[notification][inapp]', {
      to: input.to,
      title: input.title,
      content: input.content,
      providerMessageId,
    });
    return { providerMessageId };
  }
}

@Injectable()
export class NotificationService {
  private readonly adapters: Record<NotificationChannel, NotificationChannelAdapter> = {
    email: new EmailAdapter(),
    sms: new SmsAdapter(),
    inapp: new InAppAdapter(),
  };

  private readonly receipts: NotificationReceipt[] = [];

  getChannels(): NotificationChannel[] {
    return ['email', 'sms', 'inapp'];
  }

  async send(input: SendNotificationInput): Promise<NotificationReceipt> {
    return withSpan(
      'notification.send',
      {
        'notification.tenant_id': input.tenantId,
        'notification.channel': input.channel,
      },
      async () => {
        const normalizedInput = {
          ...input,
          to: input.to.trim(),
          content: input.content.trim(),
          title: input.title?.trim(),
        };

        const adapter = this.adapters[normalizedInput.channel];
        const result = await adapter.send(normalizedInput);

        const receipt: NotificationReceipt = {
          id: `notify-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          tenantId: normalizedInput.tenantId,
          channel: normalizedInput.channel,
          to: normalizedInput.to,
          toMasked: maskEmail(normalizedInput.to),
          title: normalizedInput.title,
          content: normalizedInput.content,
          providerMessageId: result.providerMessageId,
          createdAt: new Date().toISOString(),
        };

        this.receipts.unshift(receipt);
        if (this.receipts.length > 500) {
          this.receipts.pop();
        }

        return receipt;
      },
    );
  }

  list(tenantId?: string): NotificationReceipt[] {
    if (!tenantId) {
      return this.receipts;
    }

    return this.receipts.filter((item) => item.tenantId === tenantId);
  }
}
