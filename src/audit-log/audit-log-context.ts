export const AUDIT_LOG_CONTEXT_KEY = 'auditLogContext';

export interface AuditLogContext {
  userId?: string;
  companyId?: string | null;
  branchId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  deviceId?: string | null;
}
