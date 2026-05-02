import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationDelivery } from './notification-delivery.entity';

export enum NotificationCategory {
  SOCIAL = 'SOCIAL',
  SYSTEM = 'SYSTEM',
  SECURITY = 'SECURITY',
  MARKETING = 'MARKETING',
  BILLING = 'BILLING',
  WORKFLOW = 'WORKFLOW',
}

export enum NotificationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
}

@Entity()
export class Notification extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notifications, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ length: 160 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    default: NotificationCategory.SYSTEM,
  })
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.NORMAL,
  })
  priority: NotificationPriority;

  @Column({ type: 'simple-json', nullable: true })
  data?: Record<string, unknown>;

  @Column({ length: 2048, nullable: true })
  actionUrl?: string;

  @Column({ length: 512, nullable: true })
  imageUrl?: string;

  @Column({ type: 'datetime', nullable: true })
  readAt?: Date;

  @Column({ length: 3, default: 'USD' })
  costCurrency: string;

  @Column({ type: 'int', default: 0 })
  estimatedCostMinorUnit: number;

  @OneToMany(() => NotificationDelivery, (delivery) => delivery.notification, {
    cascade: true,
  })
  deliveries: NotificationDelivery[];
}
