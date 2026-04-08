import { Injectable } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { withSpan } from '../infrastructure/observability/tracing';

export type FileProvider = 'local' | 'object';

export interface UploadFileInput {
  tenantId: string;
  fileName: string;
  content: string;
  contentType?: string;
}

export interface FileRecord {
  id: string;
  tenantId: string;
  fileName: string;
  filePath: string;
  provider: FileProvider;
  contentType: string;
  size: number;
  createdAt: string;
}

interface FileStorageAdapter {
  upload(input: UploadFileInput): Promise<{ filePath: string; size: number }>;
}

class LocalStorageAdapter implements FileStorageAdapter {
  async upload(input: UploadFileInput): Promise<{ filePath: string; size: number }> {
    const baseDir = resolve(process.env.LOCAL_FILE_DIR ?? './.data/uploads');
    const tenantDir = join(baseDir, input.tenantId);
    await mkdir(tenantDir, { recursive: true });

    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${Date.now()}-${safeName}`;
    const filePath = join(tenantDir, key);

    await writeFile(filePath, input.content, 'utf8');
    return {
      filePath,
      size: Buffer.byteLength(input.content, 'utf8'),
    };
  }
}

class ObjectStorageAdapter implements FileStorageAdapter {
  async upload(input: UploadFileInput): Promise<{ filePath: string; size: number }> {
    const baseUrl = process.env.OBJECT_STORAGE_BASE_URL ?? 'https://storage.local';
    const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${input.tenantId}/${Date.now()}-${safeName}`;

    return {
      filePath: `${baseUrl}/${key}`,
      size: Buffer.byteLength(input.content, 'utf8'),
    };
  }
}

@Injectable()
export class FileService {
  private readonly records: FileRecord[] = [];

  private getProvider(): FileProvider {
    return process.env.FILE_PROVIDER === 'object' ? 'object' : 'local';
  }

  private getAdapter(provider: FileProvider): FileStorageAdapter {
    if (provider === 'object') {
      return new ObjectStorageAdapter();
    }

    return new LocalStorageAdapter();
  }

  async upload(input: UploadFileInput): Promise<FileRecord> {
    return withSpan(
      'file.upload',
      {
        'file.tenant_id': input.tenantId,
        'file.name': input.fileName,
      },
      async () => {
        const provider = this.getProvider();
        const adapter = this.getAdapter(provider);
        const normalizedInput = {
          ...input,
          fileName: input.fileName.trim(),
          content: input.content,
          contentType: input.contentType?.trim() || 'text/plain',
        };

        const uploadResult = await adapter.upload(normalizedInput);

        const record: FileRecord = {
          id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          tenantId: normalizedInput.tenantId,
          fileName: normalizedInput.fileName,
          filePath: uploadResult.filePath,
          provider,
          contentType: normalizedInput.contentType,
          size: uploadResult.size,
          createdAt: new Date().toISOString(),
        };

        this.records.unshift(record);
        if (this.records.length > 500) {
          this.records.pop();
        }

        return record;
      },
    );
  }

  list(tenantId?: string): FileRecord[] {
    if (!tenantId) {
      return this.records;
    }

    return this.records.filter((record) => record.tenantId === tenantId);
  }
}
