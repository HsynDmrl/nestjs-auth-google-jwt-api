import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { NotificationCategory } from 'src/entities/notification.entity';

export class NotificationQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Sadece okunmamış bildirimleri döndür',
    default: false,
  })
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(NotificationCategory)
  @ApiPropertyOptional({ enum: NotificationCategory })
  category?: NotificationCategory;
}
