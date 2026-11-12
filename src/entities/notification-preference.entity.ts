import { Column, Entity, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { NotificationCategory } from './notification.entity';
import { NotificationChannel } from './notification-delivery.entity';

@Entity()
@Unique('notification_preference_unique', ['user', 'channel'])
export class NotificationPreference extends BaseEntity {
  @ManyToOne(() => User, (user) => user.notificationPreferences, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ type: 'enum', enum: NotificationChannel })
  channel: NotificationChannel;

  @Column({ default: false })
  isMuted: boolean;

  @Column({ type: 'datetime', nullable: true })
  mutedUntil?: Date;

  @Column({ type: 'simple-json', nullable: true })
  mutedCategories?: NotificationCategory[];

  @Column({ length: 250, nullable: true })
  reason?: string;
}
