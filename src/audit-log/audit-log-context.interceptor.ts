import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { ClsService } from 'nestjs-cls';
import { AUDIT_LOG_CONTEXT_KEY, AuditLogContext } from './audit-log-context';
import { RequestWithTenantContext } from 'src/tenancy/interfaces/tenant-context.interface';

const getHeaderValue = (
  value?: string | string[],
): string | undefined => {
  if (!value) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};

@Injectable()
export class AuditLogContextInterceptor implements NestInterceptor {
  constructor(private readonly clsService: ClsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<RequestWithTenantContext>();

    const userId = request.user?.id;
    const branchId = getHeaderValue(request.headers['x-branch-id']);
    const deviceId = getHeaderValue(request.headers['x-device-id']);
    const userAgent = getHeaderValue(request.headers['user-agent']);

    const forwardedFor = getHeaderValue(request.headers['x-forwarded-for']);
    const ipAddress =
      forwardedFor?.split(',')[0]?.trim() ??
      request.ip ??
      request.socket?.remoteAddress ??
      undefined;

    const tenantContext = request.tenantContext;

    const auditContext: AuditLogContext = {
      userId,
      companyId: tenantContext?.companyId ?? null,
      branchId: branchId ?? null,
      deviceId: deviceId ?? null,
      userAgent: userAgent ?? null,
      ipAddress: ipAddress ?? null,
    };

    this.clsService.set(AUDIT_LOG_CONTEXT_KEY, auditContext);

    return next.handle();
  }
}
