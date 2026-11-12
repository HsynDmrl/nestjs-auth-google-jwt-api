import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailService } from 'src/auth/email/email.service';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  buildPaginationMeta,
  normalizePagination,
} from 'src/common/utils/pagination.util';
import {
  Notification,
  NotificationCategory,
  NotificationPriority,
} from 'src/entities/notification.entity';
import {
  NotificationChannel,
  NotificationDelivery,
  NotificationDeliveryStatus,
} from 'src/entities/notification-delivery.entity';
import { NotificationPreference } from 'src/entities/notification-preference.entity';
import { User } from 'src/entities/user.entity';
import { IsNull, Repository } from 'typeorm';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Injectable()
export class NotificationsService {
  private readonly costCurrency =
    process.env.NOTIFICATION_COST_CURRENCY ?? 'USD';

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationDelivery)
    private readonly deliveryRepository: Repository<NotificationDelivery>,
    @InjectRepository(NotificationPreference)
    private readonly preferenceRepository: Repository<NotificationPreference>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const user = await this.userRepository.findOne({
      where: { id: createNotificationDto.recipientId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const category =
      createNotificationDto.category ?? NotificationCategory.SYSTEM;
    const notification = this.notificationRepository.create({
      user,
      title: createNotificationDto.title.trim(),
      body: createNotificationDto.body.trim(),
      category,
      priority: createNotificationDto.priority ?? NotificationPriority.NORMAL,
      actionUrl: createNotificationDto.actionUrl?.trim(),
      imageUrl: createNotificationDto.imageUrl?.trim(),
      data: createNotificationDto.data,
      costCurrency: this.costCurrency,
      estimatedCostMinorUnit: 0,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    const preferences = await this.preferenceRepository.find({
      where: { user: { id: user.id } },
    });
    const preferenceByChannel = new Map(
      preferences.map((preference) => [preference.channel, preference]),
    );
    const now = new Date();

    const deliveries = createNotificationDto.channels.map((channel) => {
      const preference = preferenceByChannel.get(channel);
      const isMuted = this.isChannelMuted(preference, category, now);
      return this.deliveryRepository.create({
        notification: savedNotification,
        channel,
        status: isMuted
          ? NotificationDeliveryStatus.MUTED
          : NotificationDeliveryStatus.QUEUED,
        costCurrency: this.costCurrency,
        costMinorUnit: isMuted ? 0 : this.getChannelCostMinorUnit(channel),
      });
    });

    const savedDeliveries = await this.deliveryRepository.save(deliveries);
    const estimatedCostMinorUnit = savedDeliveries.reduce(
      (total, delivery) => total + delivery.costMinorUnit,
      0,
    );

    if (estimatedCostMinorUnit !== savedNotification.estimatedCostMinorUnit) {
      savedNotification.estimatedCostMinorUnit = estimatedCostMinorUnit;
      await this.notificationRepository.save(savedNotification);
    }

    await this.dispatchDeliveries(savedNotification, savedDeliveries, user);

    return this.notificationRepository.findOneOrFail({
      where: { id: savedNotification.id },
      relations: ['deliveries'],
    });
  }

  async listForUser(
    userId: string,
    query: NotificationQueryDto,
  ): Promise<PaginatedResponse<Notification>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where: Record<string, any> = {
      user: { id: userId },
    };

    if (query.unreadOnly) {
      where.readAt = IsNull();
    }

    if (query.category) {
      where.category = query.category;
    }

    const [data, total] = await this.notificationRepository.findAndCount({
      where,
      relations: ['deliveries'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async markRead(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
      relations: ['deliveries'],
    });

    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı.');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async markUnread(
    userId: string,
    notificationId: string,
  ): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, user: { id: userId } },
      relations: ['deliveries'],
    });

    if (!notification) {
      throw new NotFoundException('Bildirim bulunamadı.');
    }

    if (notification.readAt) {
      notification.readAt = null;
      await this.notificationRepository.save(notification);
    }

    return notification;
  }

  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    return this.preferenceRepository.find({
      where: { user: { id: userId } },
      order: { updatedAt: 'DESC' },
    });
  }

  async upsertPreference(
    userId: string,
    preferenceDto: NotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const existingPreference = await this.preferenceRepository.findOne({
      where: {
        user: { id: userId },
        channel: preferenceDto.channel,
      },
    });

    const preference =
      existingPreference ??
      this.preferenceRepository.create({
        user,
        channel: preferenceDto.channel,
      });

    if (preferenceDto.isMuted !== undefined) {
      preference.isMuted = preferenceDto.isMuted;
    }

    preference.mutedUntil = preferenceDto.mutedUntil
      ? new Date(preferenceDto.mutedUntil)
      : null;
    preference.mutedCategories =
      preferenceDto.mutedCategories?.length > 0
        ? preferenceDto.mutedCategories
        : null;
    preference.reason = preferenceDto.reason?.trim();

    return this.preferenceRepository.save(preference);
  }

  private getChannelCostMinorUnit(channel: NotificationChannel): number {
    const envValues = {
      [NotificationChannel.IN_APP]:
        process.env.NOTIFICATION_COST_IN_APP_MINOR_UNIT,
      [NotificationChannel.PUSH]: process.env.NOTIFICATION_COST_PUSH_MINOR_UNIT,
      [NotificationChannel.EMAIL]:
        process.env.NOTIFICATION_COST_EMAIL_MINOR_UNIT,
    };

    const defaults = {
      [NotificationChannel.IN_APP]: 0,
      [NotificationChannel.PUSH]: 1,
      [NotificationChannel.EMAIL]: 2,
    };

    const parsedValue = Number.parseInt(envValues[channel] ?? '', 10);
    const cost = Number.isFinite(parsedValue) ? parsedValue : defaults[channel];
    return Math.max(0, cost);
  }

  private isChannelMuted(
    preference: NotificationPreference | undefined,
    category: NotificationCategory,
    now: Date,
  ): boolean {
    if (!preference || !preference.isMuted) {
      return false;
    }

    if (preference.mutedUntil && preference.mutedUntil <= now) {
      return false;
    }

    if (preference.mutedCategories && preference.mutedCategories.length > 0) {
      return preference.mutedCategories.includes(category);
    }

    return true;
  }

  private async dispatchDeliveries(
    notification: Notification,
    deliveries: NotificationDelivery[],
    user: User,
  ): Promise<void> {
    const updates: NotificationDelivery[] = [];

    for (const delivery of deliveries) {
      if (delivery.status !== NotificationDeliveryStatus.QUEUED) {
        continue;
      }

      switch (delivery.channel) {
        case NotificationChannel.IN_APP:
          delivery.status = NotificationDeliveryStatus.SENT;
          delivery.sentAt = new Date();
          updates.push(delivery);
          break;
        case NotificationChannel.EMAIL:
          await this.handleEmailDelivery(notification, delivery, user, updates);
          break;
        case NotificationChannel.PUSH:
          this.handlePushDelivery(delivery);
          updates.push(delivery);
          break;
      }
    }

    if (updates.length > 0) {
      await this.deliveryRepository.save(updates);
    }
  }

  private async handleEmailDelivery(
    notification: Notification,
    delivery: NotificationDelivery,
    user: User,
    updates: NotificationDelivery[],
  ): Promise<void> {
    try {
      const actionButton = notification.actionUrl
        ? `<a href="${notification.actionUrl}" style="display:inline-block;padding:12px 20px;background-color:#4f46e5;color:#ffffff;border-radius:6px;text-decoration:none;">Detayı Gör</a>`
        : '';

      await this.emailService.sendEmail(
        user.email,
        notification.title,
        'notification',
        {
          title: notification.title,
          body: notification.body,
          actionButton,
        },
      );
      delivery.status = NotificationDeliveryStatus.SENT;
      delivery.provider = 'smtp';
      delivery.sentAt = new Date();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Email gönderilemedi.';
      delivery.status = NotificationDeliveryStatus.FAILED;
      delivery.errorMessage = errorMessage;
      delivery.sentAt = new Date();
    }

    updates.push(delivery);
  }

  private handlePushDelivery(delivery: NotificationDelivery): void {
    delivery.status = NotificationDeliveryStatus.SENT;
    delivery.provider = 'mock';
    delivery.providerMessageId = `push_${delivery.id}`;
    delivery.sentAt = new Date();
  }
}
