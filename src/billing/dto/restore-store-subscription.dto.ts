import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  SubscriptionEnvironment,
  SubscriptionPlatform,
} from 'src/entities/subscription.entity';

export class RestoreStoreSubscriptionDto {
  @IsUUID('4')
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId: string;

  @IsEnum(SubscriptionPlatform)
  @ApiProperty({ enum: SubscriptionPlatform })
  platform: SubscriptionPlatform;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ example: 'com.example.app.subscription.pro.monthly' })
  productId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: '1000001234567890' })
  transactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: '1000001234567890' })
  originalTransactionId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'purchase-token' })
  purchaseToken?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'base64-receipt' })
  receipt?: string;

  @IsOptional()
  @IsEnum(SubscriptionEnvironment)
  @ApiPropertyOptional({ enum: SubscriptionEnvironment })
  environment?: SubscriptionEnvironment;
}
