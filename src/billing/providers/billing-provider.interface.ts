import {
  PlanCode,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';

export interface StoreVerificationPayload {
  productId: string;
  transactionId?: string;
  originalTransactionId?: string;
  purchaseToken?: string;
  receipt?: string;
  environment?: SubscriptionEnvironment;
  periodStartAt?: Date;
  periodEndAt?: Date;
  rawPayload?: Record<string, unknown>;
}

export interface StoreRestorePayload {
  productId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  purchaseToken?: string;
  receipt?: string;
  environment?: SubscriptionEnvironment;
  rawPayload?: Record<string, unknown>;
}

export interface StoreWebhookPayload {
  productId: string;
  transactionId?: string;
  originalTransactionId?: string;
  environment?: SubscriptionEnvironment;
  renewalStatus?: SubscriptionRenewalStatus;
  autoRenewing?: boolean;
  periodStartAt?: Date;
  periodEndAt?: Date;
  status?: SubscriptionStatus;
  rawPayload?: Record<string, unknown>;
}

export interface StoreVerificationResult {
  planCode: PlanCode;
  platform: SubscriptionPlatform;
  productId: string;
  transactionId: string;
  originalTransactionId?: string;
  purchaseToken?: string;
  receipt?: string;
  environment: SubscriptionEnvironment;
  renewalStatus: SubscriptionRenewalStatus;
  autoRenewing: boolean;
  periodStartAt: Date;
  periodEndAt: Date;
  status: SubscriptionStatus;
  providerSubscriptionId?: string;
  rawPayload?: Record<string, unknown>;
}

export interface StoreWebhookResult extends StoreVerificationResult {
  eventType?: string;
}

export interface BillingProvider {
  platform: SubscriptionPlatform;
  verifyPurchase(
    payload: StoreVerificationPayload,
  ): Promise<StoreVerificationResult>;
  restoreSubscription(
    payload: StoreRestorePayload,
  ): Promise<StoreVerificationResult>;
  handleWebhook(payload: StoreWebhookPayload): Promise<StoreWebhookResult>;
}
