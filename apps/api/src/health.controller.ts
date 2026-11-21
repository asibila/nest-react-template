import { Controller, Get } from '@nestjs/common';
import type { HealthStatus } from '@app/shared';

@Controller('health')
export class HealthController {
  @Get()
  health(): HealthStatus {
    return { status: 'ok', service: 'api' };
  }
}
