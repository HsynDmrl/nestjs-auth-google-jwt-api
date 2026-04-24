import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Branch } from './branch.entity';
import { Subscription } from './subscription.entity';

@Entity()
export class Company extends BaseEntity {
  @Column({ length: 150, unique: true })
  name: string;

  @OneToMany(() => Branch, (branch) => branch.company)
  branches: Branch[];

  @OneToMany(() => Subscription, (subscription) => subscription.company)
  subscriptions: Subscription[];
}
