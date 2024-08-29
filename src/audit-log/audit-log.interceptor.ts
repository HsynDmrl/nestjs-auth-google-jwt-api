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
    const action = context.getHandler().name;

    const oldValue = {}; // Eski değeri doldurmanız gerekecek
    const newValue = {}; // Yeni değeri doldurmanız gerekecek

    return next.handle().pipe(
      tap(async (data) => {
        await this.auditLogService.createLog(
          action,
          entity,
          request.params.id,
          oldValue,
          newValue,
          AuditLogType.SUCCESS,
          user,
        );
      }),
    );
  }
}
