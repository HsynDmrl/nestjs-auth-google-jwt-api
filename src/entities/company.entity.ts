import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Subscription } from './subscription.entity';
import { SubscriptionPurchase } from './subscription-purchase.entity';

@Entity()
export class Company extends BaseEntity {
  @Column({ length: 150, unique: true })
  name: string;

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];

  @OneToMany(() => Subscription, (subscription) => subscription.company)
  subscriptions: Subscription[];

  @OneToMany(
    () => SubscriptionPurchase,
    (subscriptionPurchase) => subscriptionPurchase.company,
  )
  subscriptionPurchases: SubscriptionPurchase[];
}
