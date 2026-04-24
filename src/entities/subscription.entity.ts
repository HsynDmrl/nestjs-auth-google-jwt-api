import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';

export enum PlanCode {
  FREE = 'FREE',
  STARTER = 'STARTER',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  GRACE_PERIOD = 'GRACE_PERIOD',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

@Entity()
@Index(['company', 'status'])
export class Subscription extends BaseEntity {
  @ManyToOne(() => Company, (company) => company.subscriptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  company: Company;

  @Column({ type: 'enum', enum: PlanCode, default: PlanCode.FREE })
  planCode: PlanCode;

  @Column({
    type: 'enum',
    enum: SubscriptionStatus,
    default: SubscriptionStatus.ACTIVE,
  })
  status: SubscriptionStatus;

  @Column({ type: 'timestamp' })
  periodStartAt: Date;

  @Column({ type: 'timestamp' })
  periodEndAt: Date;

  @Column({ length: 120, nullable: true })
  provider: string | null;

  @Column({ length: 200, nullable: true })
  providerSubscriptionId: string | null;
}
