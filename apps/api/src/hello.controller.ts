import { Controller, Get } from '@nestjs/common';
import type { HelloResponse } from '@app/shared';

@Controller('hello')
export class HelloController {
  @Get()
  hello(): HelloResponse {
    return { message: 'Hello, World!' };
  }
}
