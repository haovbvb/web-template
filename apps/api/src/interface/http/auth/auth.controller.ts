import { Body, Controller, Get, Inject, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../../../application/auth.service';
import { AuthUser } from '../../../shared/auth/auth-user';
import { JwtAuthGuard } from '../../../shared/auth/jwt-auth.guard';

interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

interface RefreshRequest {
  refreshToken: string;
}

interface AuthenticatedRequest {
  user: AuthUser;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginRequest) {
    return this.authService.login(body);
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshRequest) {
    return this.authService.refresh(body.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async profile(@Req() req: AuthenticatedRequest) {
    return req.user;
  }
}
