import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { OpenPlatformService } from '../application/open-platform.service';
import {
    decryptSensitiveText,
    encryptSensitiveText,
    maskEmail,
    maskToken,
} from '../shared/security/data-security';

describe('OpenPlatformService', () => {
  it('creates and lists api keys with masked secret', () => {
    const service = new OpenPlatformService();
    const key = service.createApiKey('t1', 'partner-a');

    expect(key.key.startsWith('ak_')).toBe(true);
    expect(key.secret.startsWith('sk_')).toBe(true);

    const list = service.listApiKeys('t1');
    expect(list).toHaveLength(1);
    expect(list[0]?.secretHint.includes('***')).toBe(true);
  });

  it('verifies request signature', () => {
    const service = new OpenPlatformService();
    const key = service.createApiKey('t1', 'partner-a');

    const timestamp = String(Date.now());
    const method = 'POST';
    const path = '/open-platform/public/echo';
    const body = JSON.stringify({ ping: 'pong' });
    const message = `${timestamp}.${method}.${path}.${body}`;
    const signature = createHmac('sha256', key.secret).update(message).digest('hex');

    const valid = service.verifySignature({
      apiKey: key.key,
      timestamp,
      signature,
      method,
      path,
      body,
    });

    expect(valid.ok).toBe(true);
    expect(valid.tenantId).toBe('t1');

    const invalid = service.verifySignature({
      apiKey: key.key,
      timestamp,
      signature: 'bad-signature',
      method,
      path,
      body,
    });

    expect(invalid.ok).toBe(false);
    expect(invalid.reason).toBe('invalid signature');
  });

  it('encrypts and decrypts sensitive text', () => {
    const plain = 'sk_sensitive_secret';
    const encrypted = encryptSensitiveText(plain);

    expect(encrypted.includes(':')).toBe(true);
    expect(encrypted.includes(plain)).toBe(false);
    expect(decryptSensitiveText(encrypted)).toBe(plain);
  });

  it('masks token and email', () => {
    expect(maskToken('ak_1234567890abcdef')).toContain('***');
    expect(maskEmail('owner@example.com')).toBe('ow***@example.com');
  });
});
