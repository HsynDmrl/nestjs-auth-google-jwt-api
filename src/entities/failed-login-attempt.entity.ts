import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class FailedLoginAttempt extends BaseEntity {
  @Column()
  ipAddress: string;

  @Column()
  email: string;

  @Column({ type: 'int', default: 1 })
  attemptCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;
}
