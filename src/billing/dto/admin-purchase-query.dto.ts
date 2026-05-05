import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { SubscriptionPlatform } from 'src/entities/subscription.entity';

export class AdminPurchaseQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId?: string;

  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ example: 'a290f1ee-6c54-4b01-90e6-d701748f0851' })
  subscriptionId?: string;

  @IsOptional()
  @IsEnum(SubscriptionPlatform)
  @ApiPropertyOptional({ enum: SubscriptionPlatform })
  platform?: SubscriptionPlatform;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ example: 'com.example.app.subscription.pro.monthly' })
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  transactionId?: string;
}
