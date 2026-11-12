import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { Notification } from 'src/entities/notification.entity';
import { NotificationPreference } from 'src/entities/notification-preference.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationPreferenceDto } from './dto/notification-preference.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { NotificationsService } from './notifications.service';

@ApiBearerAuth('access-token')
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(PermissionsGuard)
  @Permissions('admin_send_notifications')
  @HttpCode(201)
  @ApiOperation({
    summary: 'Bildirim oluşturur ve gönderir',
  })
  @ApiResponse({
    status: 201,
    description: 'Bildirim başarıyla oluşturuldu.',
    type: Notification,
  })
  create(
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Kullanıcının bildirimlerini listeler' })
  @ApiResponse({
    status: 200,
    description: 'Bildirimler başarıyla listelendi.',
    type: [Notification],
  })
  list(
    @Req() req,
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: NotificationQueryDto,
  ): Promise<PaginatedResponse<Notification>> {
    return this.notificationsService.listForUser(req.user.id, query);
  }

  @Patch(':notificationId/read')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bildirimi okundu olarak işaretler' })
  @ApiResponse({
    status: 200,
    description: 'Bildirim okundu olarak işaretlendi.',
    type: Notification,
  })
  markRead(
    @Req() req,
    @Param('notificationId', new ParseUUIDPipe({ version: '4' }))
    notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markRead(req.user.id, notificationId);
  }

  @Patch(':notificationId/unread')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bildirimi okunmadı olarak işaretler' })
  @ApiResponse({
    status: 200,
    description: 'Bildirim okunmadı olarak işaretlendi.',
    type: Notification,
  })
  markUnread(
    @Req() req,
    @Param('notificationId', new ParseUUIDPipe({ version: '4' }))
    notificationId: string,
  ): Promise<Notification> {
    return this.notificationsService.markUnread(req.user.id, notificationId);
  }

  @Get('preferences')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bildirim tercihlerini getirir' })
  @ApiResponse({
    status: 200,
    description: 'Bildirim tercihleri başarıyla listelendi.',
    type: [NotificationPreference],
  })
  getPreferences(@Req() req): Promise<NotificationPreference[]> {
    return this.notificationsService.getPreferences(req.user.id);
  }

  @Put('preferences')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bildirim tercihlerini günceller' })
  @ApiResponse({
    status: 200,
    description: 'Bildirim tercihleri güncellendi.',
    type: NotificationPreference,
  })
  upsertPreference(
    @Req() req,
    @Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    )
    preferenceDto: NotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    return this.notificationsService.upsertPreference(
      req.user.id,
      preferenceDto,
    );
  }
}
