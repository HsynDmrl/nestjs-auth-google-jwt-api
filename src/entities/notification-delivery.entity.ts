import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Notification } from './notification.entity';

export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  EMAIL = 'EMAIL',
}

export enum NotificationDeliveryStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  FAILED = 'FAILED',
  MUTED = 'MUTED',
}

@Entity()
export class NotificationDelivery extends BaseEntity {
  @ManyToOne(() => Notification, (notification) => notification.deliveries, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  notification: Notification;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({
    type: 'enum',
    enum: NotificationDeliveryStatus,
    default: NotificationDeliveryStatus.QUEUED,
  })
  status: NotificationDeliveryStatus;

  @Column({ length: 3, default: 'USD' })
  costCurrency: string;

  @Column({ type: 'int', default: 0 })
  costMinorUnit: number;

  @Column({ length: 100, nullable: true })
  provider?: string;

  @Column({ length: 150, nullable: true })
  providerMessageId?: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'datetime', nullable: true })
  sentAt?: Date;
}
