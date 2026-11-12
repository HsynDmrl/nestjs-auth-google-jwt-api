import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHmac, timingSafeEqual } from 'crypto';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';
import { Company } from 'src/entities/company.entity';
import { Membership } from 'src/entities/membership.entity';
import {
  PlanCode,
  Subscription,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import { SubscriptionPurchase } from 'src/entities/subscription-purchase.entity';
import { Repository } from 'typeorm';
import { CompanySubscriptionStatusDto } from './dto/company-subscription-status.dto';
import { RestoreStoreSubscriptionDto } from './dto/restore-store-subscription.dto';
import { StoreWebhookDto } from './dto/store-webhook.dto';
import { VerifyStorePurchaseDto } from './dto/verify-store-purchase.dto';
import { AppStoreProvider } from './providers/app-store.provider';
import {
  BillingProvider,
  StoreVerificationResult,
} from './providers/billing-provider.interface';
import { GooglePlayProvider } from './providers/google-play.provider';

@Injectable()
export class StoreBillingService {
  private readonly providers = new Map<SubscriptionPlatform, BillingProvider>();

  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPurchase)
    private readonly purchaseRepository: Repository<SubscriptionPurchase>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    private readonly auditLogService: AuditLogService,
    private readonly googlePlayProvider: GooglePlayProvider,
    private readonly appStoreProvider: AppStoreProvider,
  ) {
    this.providers.set(
      this.googlePlayProvider.platform,
      this.googlePlayProvider,
    );
    this.providers.set(this.appStoreProvider.platform, this.appStoreProvider);
  }

  async verifyPurchase(
    dto: VerifyStorePurchaseDto,
    userId: string,
  ): Promise<CompanySubscriptionStatusDto> {
    await this.assertUserCompanyAccess(userId, dto.companyId);
    const provider = this.getProvider(dto.platform);
    const result = await provider.verifyPurchase({
      productId: dto.productId,
      transactionId: dto.transactionId,
      originalTransactionId: dto.originalTransactionId,
      purchaseToken: dto.purchaseToken,
      receipt: dto.receipt,
      environment: dto.environment,
      periodStartAt: dto.periodStartAt
        ? new Date(dto.periodStartAt)
        : undefined,
      periodEndAt: dto.periodEndAt ? new Date(dto.periodEndAt) : undefined,
    });

    const subscription = await this.applyVerificationResult(
      dto.companyId,
      result,
      'verify',
      { id: userId },
    );
    return this.mapSubscriptionStatus(dto.companyId, subscription);
  }

  async restoreSubscription(
    dto: RestoreStoreSubscriptionDto,
    userId: string,
  ): Promise<CompanySubscriptionStatusDto> {
    await this.assertUserCompanyAccess(userId, dto.companyId);
    const provider = this.getProvider(dto.platform);
    const result = await provider.restoreSubscription({
      productId: dto.productId,
      transactionId: dto.transactionId,
      originalTransactionId: dto.originalTransactionId,
      purchaseToken: dto.purchaseToken,
      receipt: dto.receipt,
      environment: dto.environment,
    });

    const subscription = await this.applyVerificationResult(
      dto.companyId,
      result,
      'restore',
      { id: userId },
    );
    return this.mapSubscriptionStatus(dto.companyId, subscription);
  }

  async handleWebhook(
    platform: SubscriptionPlatform,
    dto: StoreWebhookDto,
    signature: string | undefined,
    rawPayload: string,
  ): Promise<CompanySubscriptionStatusDto> {
    this.validateWebhookSignature(platform, signature, rawPayload);
    const provider = this.getProvider(platform);
    const result = await provider.handleWebhook({
      productId: dto.productId,
      transactionId: dto.transactionId,
      originalTransactionId: dto.originalTransactionId,
      environment: dto.environment,
      status: dto.status,
      renewalStatus: dto.renewalStatus,
      autoRenewing: dto.autoRenewing,
      periodStartAt: dto.periodStartAt
        ? new Date(dto.periodStartAt)
        : undefined,
      periodEndAt: dto.periodEndAt ? new Date(dto.periodEndAt) : undefined,
      rawPayload: dto.rawPayload,
    });

    const subscription = await this.applyVerificationResult(
      dto.companyId,
      result,
      'webhook',
      { id: 'system', email: 'system@platform.local' },
    );

    return this.mapSubscriptionStatus(dto.companyId, subscription);
  }

  async getCompanySubscriptionStatus(
    companyId: string,
  ): Promise<CompanySubscriptionStatusDto> {
    await this.companyRepository.findOneOrFail({ where: { id: companyId } });
    const subscription = await this.subscriptionRepository.findOne({
      where: { company: { id: companyId } },
      order: { periodEndAt: 'DESC' },
    });

    return this.mapSubscriptionStatus(companyId, subscription);
  }

  private getProvider(platform: SubscriptionPlatform): BillingProvider {
    const provider = this.providers.get(platform);
    if (!provider) {
      throw new BadRequestException('Billing provider bulunamadı.');
    }
    return provider;
  }

  private async assertUserCompanyAccess(
    userId: string,
    companyId: string,
  ): Promise<void> {
    if (!userId) {
      throw new BadRequestException('Kullanıcı kimliği gereklidir.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: userId },
        company: { id: companyId },
        isActive: true,
      },
      relations: ['user', 'company'],
    });

    if (!membership) {
      throw new ForbiddenException(
        'Bu şirket için abonelik işlemi yapma yetkiniz yok.',
      );
    }
  }

  private async applyVerificationResult(
    companyId: string,
    result: StoreVerificationResult,
    source: string,
    actor: { id: string; email?: string },
  ): Promise<Subscription> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new NotFoundException('Company bulunamadı.');
    }

    const matchingSubscription = await this.findMatchingSubscription(
      companyId,
      result,
    );
    const activeSubscription = await this.findActiveSubscription(companyId);

    if (
      activeSubscription &&
      (!matchingSubscription ||
        matchingSubscription.id !== activeSubscription.id)
    ) {
      activeSubscription.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepository.save(activeSubscription);
    }

    const subscription =
      matchingSubscription ??
      this.subscriptionRepository.create({
        company,
      });

    const previousSnapshot = matchingSubscription
      ? { ...matchingSubscription }
      : null;

    subscription.planCode = result.planCode;
    subscription.status = this.resolveStatus(result);
    subscription.periodStartAt = result.periodStartAt;
    subscription.periodEndAt = result.periodEndAt;
    subscription.provider = result.platform;
    subscription.providerSubscriptionId = result.providerSubscriptionId ?? null;
    subscription.platform = result.platform;
    subscription.productId = result.productId;
    subscription.transactionId = result.transactionId;
    subscription.originalTransactionId =
      result.originalTransactionId ?? result.transactionId;
    subscription.purchaseToken = result.purchaseToken ?? null;
    subscription.receipt = result.receipt ?? null;
    subscription.environment = result.environment;
    subscription.renewalStatus = result.renewalStatus;
    subscription.autoRenewing = result.autoRenewing;
    subscription.lastVerifiedAt = new Date();

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    await this.purchaseRepository.save(
      this.purchaseRepository.create({
        subscription: savedSubscription,
        company,
        platform: result.platform,
        productId: result.productId,
        transactionId: result.transactionId,
        originalTransactionId: result.originalTransactionId ?? null,
        purchaseToken: result.purchaseToken ?? null,
        receipt: result.receipt ?? null,
        environment: result.environment ?? SubscriptionEnvironment.PRODUCTION,
        renewalStatus: result.renewalStatus ?? null,
        purchasedAt: result.periodStartAt,
        expiresAt: result.periodEndAt,
        rawPayload: result.rawPayload ?? null,
        providerSubscriptionId: result.providerSubscriptionId ?? null,
        source,
      }),
    );

    this.auditLogService.emitLog(
      'store_subscription_sync',
      'Subscription',
      savedSubscription.id,
      previousSnapshot,
      savedSubscription,
      AuditLogType.SUCCESS,
      actor,
    );

    return savedSubscription;
  }

  private resolveStatus(result: StoreVerificationResult): SubscriptionStatus {
    if (result.periodEndAt && result.periodEndAt < new Date()) {
      return SubscriptionStatus.EXPIRED;
    }
    return result.status ?? SubscriptionStatus.ACTIVE;
  }

  private async findMatchingSubscription(
    companyId: string,
    result: StoreVerificationResult,
  ): Promise<Subscription | null> {
    const transactionKey =
      result.originalTransactionId ?? result.transactionId ?? '';
    if (!transactionKey) {
      return null;
    }

    const byOriginal = await this.subscriptionRepository.findOne({
      where: {
        company: { id: companyId },
        platform: result.platform,
        originalTransactionId: transactionKey,
      },
    });

    if (byOriginal) {
      return byOriginal;
    }

    return this.subscriptionRepository.findOne({
      where: {
        company: { id: companyId },
        platform: result.platform,
        transactionId: transactionKey,
      },
    });
  }

  private async findActiveSubscription(
    companyId: string,
  ): Promise<Subscription | null> {
    return this.subscriptionRepository.findOne({
      where: [
        {
          company: { id: companyId },
          status: SubscriptionStatus.ACTIVE,
        },
        {
          company: { id: companyId },
          status: SubscriptionStatus.GRACE_PERIOD,
        },
      ],
      order: { periodEndAt: 'DESC' },
    });
  }

  private mapSubscriptionStatus(
    companyId: string,
    subscription: Subscription | null,
  ): CompanySubscriptionStatusDto {
    if (!subscription) {
      return {
        companyId,
        planCode: PlanCode.FREE,
        status: SubscriptionStatus.EXPIRED,
      };
    }

    return {
      companyId,
      planCode: subscription.planCode,
      status:
        subscription.periodEndAt && subscription.periodEndAt < new Date()
          ? SubscriptionStatus.EXPIRED
          : subscription.status,
      platform: subscription.platform,
      productId: subscription.productId,
      transactionId: subscription.transactionId,
      originalTransactionId: subscription.originalTransactionId,
      periodStartAt: subscription.periodStartAt?.toISOString(),
      periodEndAt: subscription.periodEndAt?.toISOString(),
      environment: subscription.environment,
      renewalStatus: subscription.renewalStatus,
      autoRenewing: subscription.autoRenewing,
      lastVerifiedAt: subscription.lastVerifiedAt?.toISOString(),
      providerSubscriptionId: subscription.providerSubscriptionId,
    };
  }

  private validateWebhookSignature(
    platform: SubscriptionPlatform,
    signature: string | undefined,
    payload: string,
  ): void {
    const secret = this.getWebhookSecret(platform);
    if (!secret) {
      return;
    }

    if (!signature) {
      throw new BadRequestException('Webhook imzası eksik.');
    }

    const digest = createHmac('sha256', secret).update(payload).digest('hex');

    if (
      digest.length !== signature.length ||
      !timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
    ) {
      throw new BadRequestException('Webhook imzası doğrulanamadı.');
    }
  }

  private getWebhookSecret(platform: SubscriptionPlatform): string | undefined {
    if (platform === SubscriptionPlatform.GOOGLE_PLAY) {
      return process.env.BILLING_GOOGLE_PLAY_WEBHOOK_SECRET ?? undefined;
    }
    return process.env.BILLING_APP_STORE_WEBHOOK_SECRET ?? undefined;
  }
}
