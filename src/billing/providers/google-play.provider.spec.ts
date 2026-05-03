import { BadRequestException } from '@nestjs/common';
import {
  PlanCode,
  SubscriptionPlatform,
} from 'src/entities/subscription.entity';
import { GooglePlayProvider } from './google-play.provider';

describe('GooglePlayProvider', () => {
  beforeEach(() => {
    process.env.BILLING_DEMO_MODE = 'true';
  });

  it('returns plan details for known product id', async () => {
    const provider = new GooglePlayProvider();

    const result = await provider.verifyPurchase({
      productId: 'demo.google.pro',
      transactionId: 'GPA.1234',
    });

    expect(result.planCode).toBe(PlanCode.PRO);
    expect(result.platform).toBe(SubscriptionPlatform.GOOGLE_PLAY);
  });

  it('throws for unknown product id', async () => {
    const provider = new GooglePlayProvider();

    await expect(
      provider.verifyPurchase({
        productId: 'unknown',
        transactionId: 'GPA.1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
