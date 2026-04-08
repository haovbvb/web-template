import { describe, expect, it } from 'vitest';
import { NotificationService } from '../application/notification.service';

describe('NotificationService', () => {
  it('supports unified channels list', () => {
    const service = new NotificationService();
    expect(service.getChannels()).toEqual(['email', 'sms', 'inapp']);
  });

  it('stores receipt after sending a notification', async () => {
    const service = new NotificationService();

    const receipt = await service.send({
      channel: 'email',
      to: 'owner@example.com',
      title: 'Hello',
      content: 'Welcome',
      tenantId: 't1',
    });

    expect(receipt.channel).toBe('email');
    expect(receipt.tenantId).toBe('t1');

    const list = service.list('t1');
    expect(list).toHaveLength(1);
    expect(list[0]?.to).toBe('owner@example.com');
  });
});
