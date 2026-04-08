import { describe, expect, it } from 'vitest';
import { NotificationService } from '../../application/notification.service';

describe('NotificationService unit', () => {
  it('returns supported channels', () => {
    const service = new NotificationService();
    expect(service.getChannels()).toEqual(['email', 'sms', 'inapp']);
  });

  it('stores sent notification receipt in memory', async () => {
    const service = new NotificationService();

    const receipt = await service.send({
      tenantId: 't1',
      channel: 'inapp',
      to: 'owner@example.com',
      title: 'hello',
      content: 'world',
    });

    expect(receipt.tenantId).toBe('t1');
    expect(service.list('t1')).toHaveLength(1);
  });
});
