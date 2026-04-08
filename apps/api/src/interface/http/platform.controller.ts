import { Controller, Get, Inject } from '@nestjs/common';
import { PlatformService } from '../../application/platform.service';

@Controller('platform')
export class PlatformController {
  constructor(@Inject(PlatformService) private readonly platformService: PlatformService) {}

  @Get('capabilities')
  capabilities() {
    return this.platformService.getCapabilities();
  }
}
