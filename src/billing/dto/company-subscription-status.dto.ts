import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PlanCode,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';

export class CompanySubscriptionStatusDto {
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId: string;

  @ApiProperty({ enum: PlanCode })
  planCode: PlanCode;

  @ApiProperty({ enum: SubscriptionStatus })
  status: SubscriptionStatus;

  @ApiPropertyOptional({ enum: SubscriptionPlatform })
  platform?: SubscriptionPlatform | null;

  @ApiPropertyOptional({ example: 'demo.google.starter' })
  productId?: string | null;

  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  transactionId?: string | null;

  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  originalTransactionId?: string | null;

  @ApiPropertyOptional({ example: '2026-04-01T00:00:00.000Z' })
  periodStartAt?: string | null;

  @ApiPropertyOptional({ example: '2026-04-30T23:59:59.000Z' })
  periodEndAt?: string | null;

  @ApiPropertyOptional({ enum: SubscriptionEnvironment })
  environment?: SubscriptionEnvironment | null;

  @ApiPropertyOptional({ enum: SubscriptionRenewalStatus })
  renewalStatus?: SubscriptionRenewalStatus | null;

  @ApiPropertyOptional({ example: true })
  autoRenewing?: boolean | null;

  @ApiPropertyOptional({ example: '2026-04-15T10:15:00.000Z' })
  lastVerifiedAt?: string | null;

  @ApiPropertyOptional({ example: 'sub_12345' })
  providerSubscriptionId?: string | null;
}
