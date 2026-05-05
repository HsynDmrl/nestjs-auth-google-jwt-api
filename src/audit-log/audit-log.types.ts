import { AuditLogTenantContext, AuditLogType } from 'src/entities/audit-log.entity';

export interface AuditLogEventPayload {
  action: string;
  entity: string;
  entityId?: string | null;
  oldValue?: unknown | null;
  newValue?: unknown | null;
  type?: AuditLogType;
  userId?: string;
  tenantContext?: AuditLogTenantContext | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}
