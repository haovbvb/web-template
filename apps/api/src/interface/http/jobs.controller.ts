import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { JobService } from '../../application/job.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

interface EnqueueRequest {
  name: 'notification.send' | 'report.export';
  payload: Record<string, unknown>;
}

@Controller('jobs')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('org:manage')
export class JobsController {
  constructor(
    @Inject(JobService) private readonly jobService: JobService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Post('enqueue')
  async enqueue(@CurrentTenant() tenantId: string, @Body() body: EnqueueRequest) {
    const job = await this.jobService.enqueue(body);

    this.auditService.record({
      action: 'job.enqueue',
      actor: 'system',
      tenantId,
      detail: {
        name: body.name,
        jobId: job.id,
      },
    });

    return {
      jobId: job.id,
      name: body.name,
      tenantId,
      queued: true,
    };
  }

  @Get('health')
  health() {
    return { queue: 'admin-jobs', status: 'ready' };
  }
}
