import { Injectable } from '@nestjs/common';

export type Edition = 'community' | 'pro' | 'enterprise';

@Injectable()
export class PlatformService {
  getEdition(): Edition {
    const edition = process.env.APP_EDITION ?? 'community';
    if (edition === 'pro' || edition === 'enterprise') {
      return edition;
    }

    return 'community';
  }

  getCapabilities() {
    const edition = this.getEdition();

    return {
      edition,
      features: {
        multiTenant: edition !== 'community',
        auditCenter: edition !== 'community',
        whiteLabel: edition === 'enterprise',
        openPlatform: edition !== 'community',
        advancedObservability: edition === 'enterprise',
      },
    };
  }
}
