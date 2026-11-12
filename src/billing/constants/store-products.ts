import {
  PlanCode,
  SubscriptionPlatform,
} from 'src/entities/subscription.entity';

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

export interface StoreProductMapping {
  platform: SubscriptionPlatform;
  planCode: PlanCode;
  productId: string;
  envKey: string;
  source: 'env' | 'default';
}

const getDefaultAppIdentifier = (platform: SubscriptionPlatform): string => {
  if (platform === SubscriptionPlatform.GOOGLE_PLAY) {
    return process.env.BILLING_GOOGLE_PLAY_PACKAGE_NAME ?? 'com.example.app';
  }
  return process.env.BILLING_APP_STORE_BUNDLE_ID ?? 'com.example.app';
};

const buildDefaultProductId = (
  platform: SubscriptionPlatform,
  planCode: PlanCode,
): string => {
  const appIdentifier = getDefaultAppIdentifier(platform);
  return `${appIdentifier}.subscription.${planCode.toLowerCase()}.monthly`;
};

export const getStoreProductId = (
  platform: SubscriptionPlatform,
  planCode: PlanCode,
): string => {
  const envKey = PRODUCT_ENV_KEYS[platform][planCode];
  return process.env[envKey] ?? buildDefaultProductId(platform, planCode);
};

export const listStoreProductMappings = (): StoreProductMapping[] => {
  return Object.values(SubscriptionPlatform).flatMap((platform) =>
    Object.values(PlanCode).map((planCode) => {
      const envKey = PRODUCT_ENV_KEYS[platform][planCode];
      const envValue = process.env[envKey];
      return {
        platform,
        planCode,
        productId: envValue ?? buildDefaultProductId(platform, planCode),
        envKey,
        source: envValue ? 'env' : 'default',
      };
    }),
  );
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
