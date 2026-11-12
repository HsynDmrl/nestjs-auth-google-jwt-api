import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  SubscriptionEnvironment,
  SubscriptionPlatform,
} from 'src/entities/subscription.entity';

export class VerifyStorePurchaseDto {
  @IsUUID('4')
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId: string;

  @IsEnum(SubscriptionPlatform)
  @ApiProperty({ enum: SubscriptionPlatform })
  platform: SubscriptionPlatform;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiProperty({ example: 'com.example.app.subscription.starter.monthly' })
  productId: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  transactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
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

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  periodStartAt?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.000Z' })
  periodEndAt?: string;
}
