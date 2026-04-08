import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuditService } from './application/audit.service';
import { AuthService } from './application/auth.service';
import { FileService } from './application/file.service';
import { JobService } from './application/job.service';
import { NotificationService } from './application/notification.service';
import { OpenPlatformService } from './application/open-platform.service';
import { OrganizationService } from './application/organization.service';
import { PlatformService } from './application/platform.service';
import { UserService } from './application/user.service';
import { USER_REPOSITORY } from './domain/user.repository';
import { MongoConnectionService } from './infrastructure/database/mongo.connection';
import { PrismaService } from './infrastructure/database/prisma.service';
import { buildUserRepository } from './infrastructure/repositories/user.repository.factory';
import { AuditController } from './interface/http/audit.controller';
import { AuthController } from './interface/http/auth/auth.controller';
import { FilesController } from './interface/http/files.controller';
import { JobsController } from './interface/http/jobs.controller';
import { NotificationsController } from './interface/http/notifications.controller';
import { OpenPlatformController } from './interface/http/open-platform.controller';
import { OrganizationController } from './interface/http/organization.controller';
import { PlatformController } from './interface/http/platform.controller';
import { UsersController } from './interface/http/users.controller';
import { ApiKeyGuard } from './shared/auth/api-key.guard';
import { JwtAuthGuard } from './shared/auth/jwt-auth.guard';
import { PermissionGuard } from './shared/auth/permission.guard';
import { TenantContextMiddleware } from './shared/tenant/tenant-context.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'replace_me',
    }),
  ],
  controllers: [
    UsersController,
    AuthController,
    OrganizationController,
    JobsController,
    FilesController,
    NotificationsController,
    OpenPlatformController,
    PlatformController,
    AuditController,
  ],
  providers: [
    AuthService,
    AuditService,
    FileService,
    JobService,
    NotificationService,
    OpenPlatformService,
    OrganizationService,
    PlatformService,
    ApiKeyGuard,
    JwtAuthGuard,
    PermissionGuard,
    UserService,
    PrismaService,
    MongoConnectionService,
    {
      provide: USER_REPOSITORY,
      useFactory: (prisma: PrismaService, mongo: MongoConnectionService) =>
        buildUserRepository(process.env.DB_PROVIDER, prisma, mongo),
      inject: [PrismaService, MongoConnectionService],
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
