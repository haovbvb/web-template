import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const DEFAULT_ENCRYPTION_SEED = 'dev_data_encryption_key_change_me';

function getDataKey(): Buffer {
  const raw = process.env.DATA_ENCRYPTION_KEY ?? DEFAULT_ENCRYPTION_SEED;
  return createHash('sha256').update(raw).digest();
}

export function encryptSensitiveText(plainText: string): string {
  const key = getDataKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitiveText(payload: string): string {
  const [ivHex, authTagHex, encryptedHex] = payload.split(':');
  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error('invalid encrypted payload');
  }

  const key = getDataKey();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

export function maskToken(token: string): string {
  if (token.length <= 8) {
    return `${token.slice(0, 2)}***`;
  }

  return `${token.slice(0, 4)}***${token.slice(-4)}`;
}

export function maskEmail(email: string): string {
  const atIndex = email.indexOf('@');
  if (atIndex <= 1) {
    return '***';
  }

  const name = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const visible = name.slice(0, 2);
  return `${visible}***@${domain}`;
}
