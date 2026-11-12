import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
} from 'src/entities/subscription.entity';

export class AdminPurchaseResponseDto {
  @ApiProperty({ example: 'a290f1ee-6c54-4b01-90e6-d701748f0851' })
  id: string;

  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId: string;

  @ApiProperty({ example: 'b290f1ee-6c54-4b01-90e6-d701748f0851' })
  subscriptionId: string;

  @ApiProperty({ enum: SubscriptionPlatform })
  platform: SubscriptionPlatform;

  @ApiProperty({ example: 'com.example.app.subscription.pro.monthly' })
  productId: string;

  @ApiProperty({ example: 'GPA.1234-5678-9012-34567' })
  transactionId: string;

  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  originalTransactionId?: string | null;

  @ApiPropertyOptional({ example: 'purchase-token' })
  purchaseToken?: string | null;

  @ApiPropertyOptional({ example: 'base64-receipt' })
  receipt?: string | null;

  @ApiPropertyOptional({ enum: SubscriptionEnvironment })
  environment?: SubscriptionEnvironment | null;

  @ApiPropertyOptional({ enum: SubscriptionRenewalStatus })
  renewalStatus?: SubscriptionRenewalStatus | null;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  purchasedAt?: string | null;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.000Z' })
  expiresAt?: string | null;

  @ApiPropertyOptional({ description: 'Orijinal mağaza payloadu' })
  rawPayload?: Record<string, unknown> | null;

  @ApiPropertyOptional({ example: 'sub_12345' })
  providerSubscriptionId?: string | null;

  @ApiPropertyOptional({ example: 'verify' })
  source?: string | null;

  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  createdAt: string;
}
