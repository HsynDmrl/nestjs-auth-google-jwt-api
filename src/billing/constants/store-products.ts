import {
  PlanCode,
  SubscriptionPlatform,
} from 'src/entities/subscription.entity';

const DEFAULT_STORE_PRODUCT_IDS: Record<
  SubscriptionPlatform,
  Record<PlanCode, string>
> = {
  [SubscriptionPlatform.GOOGLE_PLAY]: {
    [PlanCode.FREE]: 'demo.google.free',
    [PlanCode.STARTER]: 'demo.google.starter',
    [PlanCode.PRO]: 'demo.google.pro',
    [PlanCode.ENTERPRISE]: 'demo.google.enterprise',
  },
  [SubscriptionPlatform.APP_STORE]: {
    [PlanCode.FREE]: 'demo.apple.free',
    [PlanCode.STARTER]: 'demo.apple.starter',
    [PlanCode.PRO]: 'demo.apple.pro',
    [PlanCode.ENTERPRISE]: 'demo.apple.enterprise',
  },
};

const PRODUCT_ENV_KEYS: Record<
  SubscriptionPlatform,
  Record<PlanCode, string>
> = {
  [SubscriptionPlatform.GOOGLE_PLAY]: {
    [PlanCode.FREE]: 'BILLING_GOOGLE_PLAY_PRODUCT_ID_FREE',
    [PlanCode.STARTER]: 'BILLING_GOOGLE_PLAY_PRODUCT_ID_STARTER',
    [PlanCode.PRO]: 'BILLING_GOOGLE_PLAY_PRODUCT_ID_PRO',
    [PlanCode.ENTERPRISE]: 'BILLING_GOOGLE_PLAY_PRODUCT_ID_ENTERPRISE',
  },
  [SubscriptionPlatform.APP_STORE]: {
    [PlanCode.FREE]: 'BILLING_APP_STORE_PRODUCT_ID_FREE',
    [PlanCode.STARTER]: 'BILLING_APP_STORE_PRODUCT_ID_STARTER',
    [PlanCode.PRO]: 'BILLING_APP_STORE_PRODUCT_ID_PRO',
    [PlanCode.ENTERPRISE]: 'BILLING_APP_STORE_PRODUCT_ID_ENTERPRISE',
  },
};

export const getStoreProductId = (
  platform: SubscriptionPlatform,
  planCode: PlanCode,
): string => {
  const envKey = PRODUCT_ENV_KEYS[platform][planCode];
  return process.env[envKey] ?? DEFAULT_STORE_PRODUCT_IDS[platform][planCode];
};

export const resolvePlanByProductId = (
  platform: SubscriptionPlatform,
  productId: string,
): PlanCode | null => {
  const entries = Object.values(PlanCode).map((planCode) => ({
    planCode,
    productId: getStoreProductId(platform, planCode),
  }));

  const match = entries.find((entry) => entry.productId === productId);
  return match?.planCode ?? null;
};
