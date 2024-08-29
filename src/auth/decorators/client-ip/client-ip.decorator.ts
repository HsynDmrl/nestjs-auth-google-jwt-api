import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as requestIp from 'request-ip';

export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return requestIp.getClientIp(request) || '0.0.0.0'; // IP adresini al veya 0.0.0.0 döndür
  },
);
