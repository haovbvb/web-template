import { Injectable } from '@nestjs/common';

export interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  tenantId: string;
  detail?: Record<string, unknown>;
  createdAt: string;
}

@Injectable()
export class AuditService {
  private readonly entries: AuditEntry[] = [];

  record(input: Omit<AuditEntry, 'id' | 'createdAt'>): AuditEntry {
    const entry: AuditEntry = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      ...input,
    };

    this.entries.unshift(entry);
    if (this.entries.length > 500) {
      this.entries.pop();
    }

    return entry;
  }

  list(tenantId?: string): AuditEntry[] {
    if (!tenantId) {
      return this.entries;
    }

    return this.entries.filter((entry) => entry.tenantId === tenantId);
  }
}
