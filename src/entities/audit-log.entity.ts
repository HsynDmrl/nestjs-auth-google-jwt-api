import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum AuditLogType {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

export interface AuditLogTenantContext {
  companyId?: string | null;
  branchId?: string | null;
}

@Entity()
export class AuditLog extends BaseEntity {
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User | null;

  @Column({ type: 'jsonb', nullable: true })
  tenantContext?: AuditLogTenantContext | null;

  @Column()
  action: string;

  @Column()
  entity: string;

  @Column({ nullable: true })
  entityId?: string | null;

  @Column({ type: 'jsonb', nullable: true })
  oldValue?: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true })
  newValue?: Record<string, unknown> | null;

  @Column({ length: 120, nullable: true })
  ipAddress?: string | null;

  @Column({ length: 255, nullable: true })
  userAgent?: string | null;

  @Column({ length: 120, nullable: true })
  deviceId?: string | null;

  @Column({ type: 'enum', enum: AuditLogType, default: AuditLogType.SUCCESS })
  type: AuditLogType;
}
