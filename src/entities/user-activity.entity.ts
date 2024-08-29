import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { AuditLogType } from './audit-log.entity';

@Entity()
export class UserActivity extends BaseEntity {
    @Column()
    action: string;

    @Column()
    ipAddress: string;

    @Column()
    country: string;

    @Column()
    city: string;

    @Column({ type: 'enum', enum: AuditLogType })
    type: AuditLogType;

    @ManyToOne(() => User, user => user.activities)
    user: User;
}
