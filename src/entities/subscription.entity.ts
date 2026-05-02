import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import { SubscriptionPurchase } from './subscription-purchase.entity';

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

export enum SubscriptionPlatform {
  GOOGLE_PLAY = 'GOOGLE_PLAY',
  APP_STORE = 'APP_STORE',
}

export enum SubscriptionEnvironment {
  PRODUCTION = 'PRODUCTION',
  SANDBOX = 'SANDBOX',
}

export enum SubscriptionRenewalStatus {
  ACTIVE = 'ACTIVE',
  GRACE = 'GRACE',
  CANCELED = 'CANCELED',
  PAUSED = 'PAUSED',
  ON_HOLD = 'ON_HOLD',
  EXPIRED = 'EXPIRED',
}

@Entity()
@Index(['company', 'status'])
@Index(['platform', 'transactionId'])
@Index(['platform', 'originalTransactionId'])
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

  @Column({ type: 'enum', enum: SubscriptionPlatform, nullable: true })
  platform: SubscriptionPlatform | null;

  @Column({ length: 200, nullable: true })
  productId: string | null;

  @Column({ length: 220, nullable: true })
  transactionId: string | null;

  @Column({ length: 220, nullable: true })
  originalTransactionId: string | null;

  @Column({ type: 'text', nullable: true })
  purchaseToken: string | null;

  @Column({ type: 'text', nullable: true })
  receipt: string | null;

  @Column({ type: 'enum', enum: SubscriptionEnvironment, nullable: true })
  environment: SubscriptionEnvironment | null;

  @Column({ type: 'enum', enum: SubscriptionRenewalStatus, nullable: true })
  renewalStatus: SubscriptionRenewalStatus | null;

  @Column({ type: 'boolean', nullable: true })
  autoRenewing: boolean | null;

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt: Date | null;

  @OneToMany(() => SubscriptionPurchase, (purchase) => purchase.subscription)
  purchases: SubscriptionPurchase[];
}
