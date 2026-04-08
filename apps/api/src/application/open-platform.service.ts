import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  decryptSensitiveText,
  encryptSensitiveText,
  maskToken,
} from '../shared/security/data-security';

export interface ApiKeyRecord {
  id: string;
  tenantId: string;
  name: string;
  key: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastUsedAt?: string;
}

interface StoredApiKeyRecord extends ApiKeyRecord {
  secretEncrypted: string;
  secretSuffix: string;
}

export interface ApiKeyIssueResult extends ApiKeyRecord {
  secret: string;
}

export interface ApiCallLog {
  id: string;
  tenantId: string;
  keyId?: string;
  method: string;
  path: string;
  success: boolean;
  reason?: string;
  createdAt: string;
}

interface VerifySignatureInput {
  apiKey: string;
  timestamp: string;
  signature: string;
  method: string;
  path: string;
  body: string;
}

@Injectable()
export class OpenPlatformService {
  private readonly keys: StoredApiKeyRecord[] = [];
  private readonly logs: ApiCallLog[] = [];

  createApiKey(tenantId: string, name: string): ApiKeyIssueResult {
    const secret = `sk_${randomBytes(16).toString('hex')}`;

    const record: StoredApiKeyRecord = {
      id: `apikey-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tenantId,
      name: name.trim() || 'default-key',
      key: `ak_${randomBytes(8).toString('hex')}`,
      secretEncrypted: encryptSensitiveText(secret),
      secretSuffix: secret.slice(-4),
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    this.keys.unshift(record);
    if (this.keys.length > 200) {
      this.keys.pop();
    }

    return {
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      key: record.key,
      secret,
      status: record.status,
      createdAt: record.createdAt,
      lastUsedAt: record.lastUsedAt,
    };
  }

  listApiKeys(tenantId: string) {
    return this.keys
      .filter((item) => item.tenantId === tenantId)
      .map((item) => ({
        id: item.id,
        tenantId: item.tenantId,
        name: item.name,
        key: maskToken(item.key),
        secretHint: `sk_***${item.secretSuffix}`,
        status: item.status,
        createdAt: item.createdAt,
        lastUsedAt: item.lastUsedAt,
      }));
  }

  verifySignature(input: VerifySignatureInput): {
    ok: boolean;
    reason?: string;
    tenantId?: string;
    keyId?: string;
  } {
    const keyRecord = this.keys.find((item) => item.key === input.apiKey);
    if (!keyRecord) {
      return { ok: false, reason: 'api key not found' };
    }

    if (keyRecord.status !== 'active') {
      return {
        ok: false,
        reason: 'api key disabled',
        keyId: keyRecord.id,
        tenantId: keyRecord.tenantId,
      };
    }

    const timestampMs = Number(input.timestamp);
    if (!Number.isFinite(timestampMs)) {
      return {
        ok: false,
        reason: 'invalid timestamp',
        keyId: keyRecord.id,
        tenantId: keyRecord.tenantId,
      };
    }

    const skew = Math.abs(Date.now() - timestampMs);
    if (skew > 5 * 60 * 1000) {
      return {
        ok: false,
        reason: 'timestamp expired',
        keyId: keyRecord.id,
        tenantId: keyRecord.tenantId,
      };
    }

    const secret = decryptSensitiveText(keyRecord.secretEncrypted);
    const message = `${input.timestamp}.${input.method.toUpperCase()}.${input.path}.${input.body}`;
    const expected = createHmac('sha256', secret).update(message).digest('hex');

    let signatureMatched = false;
    try {
      signatureMatched = timingSafeEqual(Buffer.from(expected), Buffer.from(input.signature));
    } catch {
      signatureMatched = false;
    }

    if (!signatureMatched) {
      return {
        ok: false,
        reason: 'invalid signature',
        keyId: keyRecord.id,
        tenantId: keyRecord.tenantId,
      };
    }

    keyRecord.lastUsedAt = new Date().toISOString();

    return {
      ok: true,
      tenantId: keyRecord.tenantId,
      keyId: keyRecord.id,
    };
  }

  recordCallLog(input: Omit<ApiCallLog, 'id' | 'createdAt'>): ApiCallLog {
    const log: ApiCallLog = {
      id: `apicall-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...input,
    };

    this.logs.unshift(log);
    if (this.logs.length > 1000) {
      this.logs.pop();
    }

    return log;
  }

  listCallLogs(tenantId: string): ApiCallLog[] {
    return this.logs
      .filter((item) => item.tenantId === tenantId)
      .map((item) => ({
        ...item,
        keyId: item.keyId ? maskToken(item.keyId) : undefined,
      }));
  }
}
