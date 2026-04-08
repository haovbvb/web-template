import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuditService } from '../../application/audit.service';
import { NotificationChannel, NotificationService } from '../../application/notification.service';
import { JwtAuthGuard } from '../../shared/auth/jwt-auth.guard';
import { RequirePermissions } from '../../shared/auth/permission.decorator';
import { PermissionGuard } from '../../shared/auth/permission.guard';
import { CurrentTenant } from '../../shared/tenant/current-tenant.decorator';

interface SendNotificationRequest {
  channel: NotificationChannel;
  to: string;
  title?: string;
  content: string;
  meta?: Record<string, unknown>;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionGuard)
@RequirePermissions('org:manage')
export class NotificationsController {
  constructor(
    @Inject(NotificationService)
    private readonly notificationService: NotificationService,
    @Inject(AuditService) private readonly auditService: AuditService,
  ) {}

  @Get('channels')
  channels() {
    return { channels: this.notificationService.getChannels() };
  }

  @Post('send')
  async send(@CurrentTenant() tenantId: string, @Body() body: SendNotificationRequest) {
    const receipt = await this.notificationService.send({
      ...body,
      tenantId,
    });

    this.auditService.record({
      action: 'notification.send',
      actor: 'system',
      tenantId,
      detail: {
        channel: body.channel,
        to: body.to,
        providerMessageId: receipt.providerMessageId,
      },
    });

    return {
      sent: true,
      receipt,
    };
  }

  @Get('messages')
  messages(@CurrentTenant() tenantId: string) {
    return this.notificationService.list(tenantId);
  }
}
