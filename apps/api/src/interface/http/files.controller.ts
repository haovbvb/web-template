import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { FileService } from '../../application/file.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

interface UploadFileRequest {
  fileName: string;
  content: string;
  contentType?: string;
}

@Controller('files')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('org:manage')
export class FilesController {
  constructor(
    @Inject(FileService) private readonly fileService: FileService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Post('upload')
  async upload(@CurrentTenant() tenantId: string, @Body() body: UploadFileRequest) {
    const file = await this.fileService.upload({
      tenantId,
      fileName: body.fileName,
      content: body.content,
      contentType: body.contentType,
    });

    this.auditService.record({
      action: 'file.upload',
      actor: 'system',
      tenantId,
      detail: {
        fileName: file.fileName,
        provider: file.provider,
        size: file.size,
      },
    });

    return {
      uploaded: true,
      file,
    };
  }

  @Get('list')
  list(@CurrentTenant() tenantId: string) {
    return this.fileService.list(tenantId);
  }

  @Get('provider')
  provider() {
    return {
      provider: process.env.FILE_PROVIDER === 'object' ? 'object' : 'local',
    };
  }
}
