import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthUser } from './auth-user';
import { PERMISSIONS_KEY } from './permission.decorator';

interface AuthenticatedRequest {
  user?: AuthUser;
}

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = request.user?.permissions ?? [];

    const isAllowed = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!isAllowed) {
      throw new ForbiddenException('permission denied');
    }

    return true;
  }
}
