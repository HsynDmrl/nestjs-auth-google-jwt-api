import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Company } from './company.entity';
import {
  Subscription,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
} from './subscription.entity';

@Entity()
@Index(['subscription', 'transactionId'])
export class SubscriptionPurchase extends BaseEntity {
  @ManyToOne(() => Subscription, (subscription) => subscription.purchases, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  subscription: Subscription;

  @ManyToOne(() => Company, (company) => company.subscriptionPurchases, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  company: Company;

  @Column({ type: 'enum', enum: SubscriptionPlatform })
  platform: SubscriptionPlatform;

  @Column({ length: 200 })
  productId: string;

  @Column({ length: 220 })
  transactionId: string;

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

  @Column({ type: 'timestamp', nullable: true })
  purchasedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @Column({ type: 'json', nullable: true })
  rawPayload: Record<string, unknown> | null;

  @Column({ length: 120, nullable: true })
  providerSubscriptionId: string | null;

  @Column({ length: 40, nullable: true })
  source: string | null;
}
