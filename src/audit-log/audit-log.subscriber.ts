import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  RemoveEvent,
  UpdateEvent,
} from 'typeorm';
import { AuditLog, AuditLogType } from 'src/entities/audit-log.entity';
import { UserActivity } from 'src/entities/user-activity.entity';
import { AUDIT_LOG_CONTEXT_KEY, AuditLogContext } from './audit-log-context';
import { AUDIT_LOG_CREATED_EVENT } from './audit-log.constants';
import { AuditLogEventPayload } from './audit-log.types';
import { redactSensitiveFields } from './utils/audit-log-redaction.util';

const IGNORED_COLUMNS = new Set(['createdAt', 'updatedAt', 'deletedAt']);

@Injectable()
@EventSubscriber()
export class AuditLogSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return Object;
  }

  afterInsert(event: InsertEvent<unknown>): void {
    if (this.shouldSkip(event)) {
      return;
    }
    const newValue = this.extractEntityValues(event.entity, event);
    this.emitLog(event, 'CREATE', null, newValue);
  }

  afterUpdate(event: UpdateEvent<unknown>): void {
    if (this.shouldSkip(event)) {
      return;
    }
    const updatedColumns = event.updatedColumns.filter(
      (column) => !IGNORED_COLUMNS.has(column.propertyName),
    );
    if (updatedColumns.length === 0) {
      return;
    }

    const oldValue = this.extractEntityValues(
      event.databaseEntity,
      event,
      updatedColumns.map((column) => column.propertyName),
    );
    const newValue = this.extractEntityValues(
      event.entity ?? event.databaseEntity,
      event,
      updatedColumns.map((column) => column.propertyName),
    );
    this.emitLog(event, 'UPDATE', oldValue, newValue);
  }

  afterRemove(event: RemoveEvent<unknown>): void {
    if (this.shouldSkip(event)) {
      return;
    }
    const oldValue = this.extractEntityValues(event.databaseEntity, event);
    this.emitLog(event, 'DELETE', oldValue, null);
  }

  private shouldSkip(
    event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>,
  ): boolean {
    return (
      event.metadata.target === AuditLog ||
      event.metadata.target === UserActivity
    );
  }

  private extractEntityValues(
    entity: unknown,
    event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>,
    onlyColumns?: string[],
  ): Record<string, unknown> | null {
    if (!entity) {
      return null;
    }
    const columns = event.metadata.columns
      .filter((column) => !column.relationMetadata)
      .filter((column) => !IGNORED_COLUMNS.has(column.propertyName));

    const allowedColumns = onlyColumns
      ? columns.filter((column) => onlyColumns.includes(column.propertyName))
      : columns;

    const values = allowedColumns.reduce<Record<string, unknown>>(
      (acc, column) => {
        const value = (entity as Record<string, unknown>)[column.propertyName];
        if (value !== undefined) {
          acc[column.propertyName] = value;
        }
        return acc;
      },
      {},
    );

    return values;
  }

  private emitLog(
    event: InsertEvent<unknown> | UpdateEvent<unknown> | RemoveEvent<unknown>,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    oldValue: Record<string, unknown> | null,
    newValue: Record<string, unknown> | null,
  ): void {
    const entityName = event.metadata.name ?? event.metadata.tableName;
    const entityId =
      (event.entity as { id?: string } | undefined)?.id ??
      (event.databaseEntity as { id?: string } | undefined)?.id ??
      null;

    const context = this.clsService.get<AuditLogContext>(
      AUDIT_LOG_CONTEXT_KEY,
    );

    const payload: AuditLogEventPayload = {
      action: `${operation}_${entityName.toUpperCase()}`,
      entity: event.metadata.tableName,
      entityId,
      oldValue: redactSensitiveFields(oldValue) as Record<string, unknown> | null,
      newValue: redactSensitiveFields(newValue) as Record<string, unknown> | null,
      type: AuditLogType.SUCCESS,
      userId: context?.userId,
      tenantContext: context
        ? { companyId: context.companyId, branchId: context.branchId }
        : null,
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
      deviceId: context?.deviceId ?? null,
    };

    this.eventEmitter.emit(AUDIT_LOG_CREATED_EVENT, payload);
  }
}
