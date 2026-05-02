import { BadRequestException, Injectable } from '@nestjs/common';
import { resolvePlanByProductId } from '../constants/store-products';
import {
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import {
  BillingProvider,
  StoreRestorePayload,
  StoreVerificationPayload,
  StoreVerificationResult,
  StoreWebhookPayload,
  StoreWebhookResult,
} from './billing-provider.interface';

@Injectable()
export class AppStoreProvider implements BillingProvider {
  readonly platform = SubscriptionPlatform.APP_STORE;
  private readonly demoMode = process.env.BILLING_DEMO_MODE !== 'false';

  async verifyPurchase(
    payload: StoreVerificationPayload,
  ): Promise<StoreVerificationResult> {
    this.assertDemoMode();
    return this.buildResult(payload, payload.rawPayload);
  }

  async restoreSubscription(
    payload: StoreRestorePayload,
  ): Promise<StoreVerificationResult> {
    this.assertDemoMode();
    const mergedPayload: StoreVerificationPayload = {
      productId: payload.productId ?? '',
      transactionId: payload.transactionId,
      originalTransactionId: payload.originalTransactionId,
      purchaseToken: payload.purchaseToken,
      receipt: payload.receipt,
      environment: payload.environment,
      rawPayload: payload.rawPayload,
    };
    return this.buildResult(mergedPayload, payload.rawPayload);
  }

  async handleWebhook(
    payload: StoreWebhookPayload,
  ): Promise<StoreWebhookResult> {
    this.assertDemoMode();
    const result = await this.buildResult(payload, payload.rawPayload);
    return {
      ...result,
      status: payload.status ?? result.status,
      renewalStatus: payload.renewalStatus ?? result.renewalStatus,
      autoRenewing: payload.autoRenewing ?? result.autoRenewing,
    };
  }

  private buildResult(
    payload: StoreVerificationPayload,
    rawPayload?: Record<string, unknown>,
  ): StoreVerificationResult {
    const planCode = resolvePlanByProductId(this.platform, payload.productId);
    if (!planCode) {
      throw new BadRequestException('App Store ürün kodu tanınmadı.');
    }

    const transactionId =
      payload.transactionId ??
      payload.originalTransactionId ??
      payload.receipt ??
      '';

    if (!transactionId) {
      throw new BadRequestException('Transaction ID bilgisi zorunludur.');
    }

    const periodStartAt = payload.periodStartAt ?? new Date();
    const periodEndAt = payload.periodEndAt ?? this.addDays(periodStartAt, 30);
    const environment = payload.environment ?? SubscriptionEnvironment.SANDBOX;

    return {
      planCode,
      platform: this.platform,
      productId: payload.productId,
      transactionId,
      originalTransactionId: payload.originalTransactionId ?? transactionId,
      purchaseToken: payload.purchaseToken,
      receipt: payload.receipt,
      environment,
      renewalStatus: SubscriptionRenewalStatus.ACTIVE,
      autoRenewing: true,
      periodStartAt,
      periodEndAt,
      status: SubscriptionStatus.ACTIVE,
      providerSubscriptionId: payload.originalTransactionId ?? transactionId,
      rawPayload,
    };
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private assertDemoMode(): void {
    if (!this.demoMode) {
      throw new BadRequestException(
        'App Store doğrulaması yalnızca demo modunda kullanılabilir.',
      );
    }
  }
}
