import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  it('should be defined', () => {
    const service = new AuditLogService({} as any, {} as any, {} as any, {} as any);
    expect(service).toBeDefined();
  });
});
