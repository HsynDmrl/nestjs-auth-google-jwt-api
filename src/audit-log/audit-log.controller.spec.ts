import { AuditLogController } from './audit-log.controller';

describe('AuditLogController', () => {
  it('should be defined', () => {
    const controller = new AuditLogController({} as any);
    expect(controller).toBeDefined();
  });
});
