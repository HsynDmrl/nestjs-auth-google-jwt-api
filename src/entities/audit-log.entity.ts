import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum AuditLogType {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
}

@Entity()
export class AuditLog extends BaseEntity {
  @Column()
  action: string;

  @Column()
  entity: string;

  @Column()
  entityId: string;

  @Column({ type: 'json', nullable: true })
  oldValue?: any;

  @Column({ type: 'json', nullable: true })
  newValue?: any;

  @Column({ type: 'enum', enum: AuditLogType })
  type: AuditLogType;

  @Column({ type: 'json', nullable: true })
  user: Partial<User>;
}
