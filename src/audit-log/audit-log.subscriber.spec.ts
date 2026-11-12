import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { DataSource } from 'typeorm';
import { AuditLogSubscriber } from './audit-log.subscriber';
import { AUDIT_LOG_CONTEXT_KEY } from './audit-log-context';
import { AUDIT_LOG_CREATED_EVENT } from './audit-log.constants';
import { AuditLog } from 'src/entities/audit-log.entity';

type AuditEventShape = {
  metadata: {
    name: string;
    tableName: string;
    target?: unknown;
    columns: Array<{ propertyName: string; relationMetadata?: unknown }>;
  };
  entity?: Record<string, unknown>;
  databaseEntity?: Record<string, unknown>;
  updatedColumns?: Array<{ propertyName: string }>;
};

describe('AuditLogSubscriber', () => {
  const createSubscriber = () => {
    const dataSource = { subscribers: [] } as unknown as DataSource;
    const eventEmitter = { emit: jest.fn() } as unknown as EventEmitter2;
    const clsService = {
      get: jest.fn(() => ({
        userId: 'user-1',
        companyId: 'company-1',
        branchId: 'branch-1',
        ipAddress: '203.0.113.8',
        userAgent: 'jest-agent',
        deviceId: 'device-1',
      })),
    } as unknown as ClsService;

    const subscriber = new AuditLogSubscriber(
      dataSource,
      eventEmitter,
      clsService,
    );
    return { subscriber, dataSource, eventEmitter, clsService };
  };

  const createBaseEvent = (): AuditEventShape => ({
    metadata: {
      name: 'User',
      tableName: 'user',
      target: class User {},
      columns: [
        { propertyName: 'id' },
        { propertyName: 'email' },
        { propertyName: 'password' },
        { propertyName: 'updatedAt' },
      ],
    },
  });

  it('should register itself to data source subscribers', () => {
    const { subscriber, dataSource } = createSubscriber();
    expect(dataSource.subscribers).toContain(subscriber);
  });

  it('should emit CREATE audit event with redacted fields', () => {
    const { subscriber, eventEmitter, clsService } = createSubscriber();
    const event = createBaseEvent();
    event.entity = {
      id: 'entity-1',
      email: 'john@example.com',
      password: 'secret',
    };

    subscriber.afterInsert(event as any);

    expect(clsService.get).toHaveBeenCalledWith(AUDIT_LOG_CONTEXT_KEY);
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDIT_LOG_CREATED_EVENT,
      expect.objectContaining({
        action: 'CREATE_USER',
        entity: 'user',
        entityId: 'entity-1',
        oldValue: null,
        newValue: {
          id: 'entity-1',
          email: 'john@example.com',
          password: '***',
        },
      }),
    );
  });

  it('should emit UPDATE audit event only for changed non-ignored fields', () => {
    const { subscriber, eventEmitter } = createSubscriber();
    const event = createBaseEvent();
    event.updatedColumns = [
      { propertyName: 'password' },
      { propertyName: 'updatedAt' },
    ];
    event.databaseEntity = { id: 'entity-1', password: 'old-secret' };
    event.entity = { id: 'entity-1', password: 'new-secret' };

    subscriber.afterUpdate(event as any);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDIT_LOG_CREATED_EVENT,
      expect.objectContaining({
        action: 'UPDATE_USER',
        entityId: 'entity-1',
        oldValue: { password: '***' },
        newValue: { password: '***' },
      }),
    );
  });

  it('should not emit UPDATE event when only ignored columns changed', () => {
    const { subscriber, eventEmitter } = createSubscriber();
    const event = createBaseEvent();
    event.updatedColumns = [{ propertyName: 'updatedAt' }];
    event.databaseEntity = { id: 'entity-1', updatedAt: new Date() };
    event.entity = { id: 'entity-1', updatedAt: new Date() };

    subscriber.afterUpdate(event as any);

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  it('should emit DELETE audit event with entity id fallback from database entity', () => {
    const { subscriber, eventEmitter } = createSubscriber();
    const event = createBaseEvent();
    event.metadata.name = 'Role';
    event.metadata.tableName = 'role';
    event.databaseEntity = { id: 'entity-2', email: 'role@example.com' };

    subscriber.afterRemove(event as any);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      AUDIT_LOG_CREATED_EVENT,
      expect.objectContaining({
        action: 'DELETE_ROLE',
        entity: 'role',
        entityId: 'entity-2',
        oldValue: { id: 'entity-2', email: 'role@example.com' },
        newValue: null,
      }),
    );
  });

  it('should skip events for audit log entity itself', () => {
    const { subscriber, eventEmitter } = createSubscriber();
    const event = createBaseEvent();
    event.metadata.target = AuditLog;
    event.entity = { id: 'audit-1' };

    subscriber.afterInsert(event as any);

    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });
});
