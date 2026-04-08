import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FileService } from '../application/file.service';

const fileProviderBackup = process.env.FILE_PROVIDER;
const localDirBackup = process.env.LOCAL_FILE_DIR;
const objectBaseUrlBackup = process.env.OBJECT_STORAGE_BASE_URL;

let tempDir: string | undefined;

afterEach(async () => {
  process.env.FILE_PROVIDER = fileProviderBackup;
  process.env.LOCAL_FILE_DIR = localDirBackup;
  process.env.OBJECT_STORAGE_BASE_URL = objectBaseUrlBackup;

  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe('FileService', () => {
  it('uploads to local provider by default', async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'api-files-'));
    process.env.LOCAL_FILE_DIR = tempDir;
    delete process.env.FILE_PROVIDER;

    const service = new FileService();
    const record = await service.upload({
      tenantId: 't1',
      fileName: 'hello.txt',
      content: 'hello-world',
    });

    expect(record.provider).toBe('local');
    expect(record.filePath.includes(tempDir)).toBe(true);
    expect(record.size).toBeGreaterThan(0);
  });

  it('uploads to object provider when FILE_PROVIDER=object', async () => {
    process.env.FILE_PROVIDER = 'object';
    process.env.OBJECT_STORAGE_BASE_URL = 'https://oss.example.com';

    const service = new FileService();
    const record = await service.upload({
      tenantId: 't1',
      fileName: 'report.csv',
      content: 'id,name',
    });

    expect(record.provider).toBe('object');
    expect(record.filePath.startsWith('https://oss.example.com/t1/')).toBe(true);
  });
});
