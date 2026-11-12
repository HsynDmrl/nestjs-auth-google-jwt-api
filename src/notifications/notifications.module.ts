import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from 'src/entities/notification.entity';
import { NotificationDelivery } from 'src/entities/notification-delivery.entity';
import { NotificationPreference } from 'src/entities/notification-preference.entity';
import { User } from 'src/entities/user.entity';
import { EmailService } from 'src/auth/email/email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Notification,
      NotificationDelivery,
      NotificationPreference,
      User,
    ]),
  ],
  providers: [NotificationsService, EmailService],
  controllers: [NotificationsController],
})
export class NotificationsModule {}
