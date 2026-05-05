import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  PlanCode,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';

export class AdminSubscriptionUpdateDto {
  @IsOptional()
  @IsEnum(PlanCode)
  @ApiPropertyOptional({ enum: PlanCode })
  planCode?: PlanCode;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(SubscriptionPlatform)
  @ApiPropertyOptional({ enum: SubscriptionPlatform })
  platform?: SubscriptionPlatform;

  @IsOptional()
  @IsEnum(SubscriptionEnvironment)
  @ApiPropertyOptional({ enum: SubscriptionEnvironment })
  environment?: SubscriptionEnvironment;

  @IsOptional()
  @IsEnum(SubscriptionRenewalStatus)
  @ApiPropertyOptional({ enum: SubscriptionRenewalStatus })
  renewalStatus?: SubscriptionRenewalStatus;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  autoRenewing?: boolean;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  periodStartAt?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.000Z' })
  periodEndAt?: string;

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

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  originalTransactionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({ example: 'stripe' })
  provider?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @ApiPropertyOptional({ example: 'sub_12345' })
  providerSubscriptionId?: string;
}
