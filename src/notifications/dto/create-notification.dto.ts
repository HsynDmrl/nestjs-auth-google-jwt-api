import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { NotificationChannel } from 'src/entities/notification-delivery.entity';
import {
  NotificationCategory,
  NotificationPriority,
} from 'src/entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID('4')
  @ApiProperty({
    description: 'Bildirim gönderilecek kullanıcı ID',
    example: 'd290f1ee-6c54-4b01-90e6-d701748f0851',
  })
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  @ApiProperty({ description: 'Bildirim başlığı', maxLength: 160 })
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @ApiProperty({ description: 'Bildirim içeriği', maxLength: 2000 })
  body: string;

  @IsOptional()
  @IsEnum(NotificationCategory)
  @ApiPropertyOptional({ enum: NotificationCategory })
  category?: NotificationCategory;

  @IsOptional()
  @IsEnum(NotificationPriority)
  @ApiPropertyOptional({ enum: NotificationPriority })
  priority?: NotificationPriority;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsEnum(NotificationChannel, { each: true })
  @ApiProperty({
    description: 'Bildirim kanalları',
    isArray: true,
    enum: NotificationChannel,
  })
  channels: NotificationChannel[];

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(2048)
  @ApiPropertyOptional({ description: 'Bildirim aksiyon linki' })
  actionUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  @MaxLength(512)
  @ApiPropertyOptional({ description: 'Görsel linki' })
  imageUrl?: string;

  @IsOptional()
  @IsObject()
  @ApiPropertyOptional({ description: 'Ek veri objesi' })
  data?: Record<string, unknown>;
}
