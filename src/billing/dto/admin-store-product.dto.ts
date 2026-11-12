import { ApiProperty } from '@nestjs/swagger';
import {
  PlanCode,
  SubscriptionPlatform,
} from 'src/entities/subscription.entity';

export class AdminStoreProductDto {
  @ApiProperty({ enum: SubscriptionPlatform })
  platform: SubscriptionPlatform;

  @ApiProperty({ enum: PlanCode })
  planCode: PlanCode;

  @ApiProperty({ example: 'com.example.app.subscription.pro.monthly' })
  productId: string;

  @ApiProperty({ example: 'BILLING_GOOGLE_PLAY_PRODUCT_ID_PRO' })
  envKey: string;

  @ApiProperty({ example: 'default' })
  source: 'env' | 'default';
}
