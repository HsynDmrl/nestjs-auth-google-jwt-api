import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class FailedLoginAttempt extends BaseEntity {
  @Column()
  ipAddress: string;

  @Column()
  email: string;

  @Column({ default: 0 })
  attemptCount: number;
}
