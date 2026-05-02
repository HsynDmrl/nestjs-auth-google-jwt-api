import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { NotificationChannel } from 'src/entities/notification-delivery.entity';
import { NotificationCategory } from 'src/entities/notification.entity';

export class NotificationPreferenceDto {
  @IsEnum(NotificationChannel)
  @ApiProperty({ enum: NotificationChannel })
  channel: NotificationChannel;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({ description: 'Kanalı sessize al' })
  isMuted?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: 'Sessize alma bitiş zamanı' })
  mutedUntil?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationCategory, { each: true })
  @ApiPropertyOptional({
    description: 'Sessize alınacak kategori listesi',
    isArray: true,
    enum: NotificationCategory,
  })
  mutedCategories?: NotificationCategory[];

  @IsOptional()
  @IsString()
  @MaxLength(250)
  @ApiPropertyOptional({ description: 'Sessize alma nedeni' })
  reason?: string;
}
