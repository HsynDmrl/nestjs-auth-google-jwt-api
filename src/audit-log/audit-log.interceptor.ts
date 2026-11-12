import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogService } from './audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const entity = context.getClass().name;
    const action = `HTTP_${request.method ?? 'REQUEST'}`;
    const entityId = request.params?.id ?? null;

    return next.handle().pipe(
      tap(() => {
        this.auditLogService.emitLog(
          action,
          entity,
          entityId,
          null,
          null,
          AuditLogType.SUCCESS,
          user,
        );
      }),
    );
  }
}
