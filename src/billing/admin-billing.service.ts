import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';
import { Subscription } from 'src/entities/subscription.entity';
import { SubscriptionPurchase } from 'src/entities/subscription-purchase.entity';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { AdminPurchaseQueryDto } from './dto/admin-purchase-query.dto';
import { AdminPurchaseResponseDto } from './dto/admin-purchase-response.dto';
import { AdminStoreProductDto } from './dto/admin-store-product.dto';
import { AdminSubscriptionDetailDto } from './dto/admin-subscription-detail.dto';
import { AdminSubscriptionQueryDto } from './dto/admin-subscription-query.dto';
import { AdminSubscriptionResponseDto } from './dto/admin-subscription-response.dto';
import { AdminSubscriptionUpdateDto } from './dto/admin-subscription-update.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  buildPaginationMeta,
  normalizePagination,
} from 'src/common/utils/pagination.util';
import { listStoreProductMappings } from './constants/store-products';

@Injectable()
export class AdminBillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(SubscriptionPurchase)
    private readonly purchaseRepository: Repository<SubscriptionPurchase>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async listSubscriptions(
    query: AdminSubscriptionQueryDto,
  ): Promise<PaginatedResponse<AdminSubscriptionResponseDto>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const whereBase: FindOptionsWhere<Subscription> = {};

    if (query.companyId) {
      whereBase.company = { id: query.companyId };
    }
    if (query.planCode) {
      whereBase.planCode = query.planCode;
    }
    if (query.status) {
      whereBase.status = query.status;
    }
    if (query.platform) {
      whereBase.platform = query.platform;
    }
    if (query.environment) {
      whereBase.environment = query.environment;
    }

    const where = query.transactionId
      ? [
          {
            ...whereBase,
            transactionId: Like(`%${query.transactionId}%`),
          },
          {
            ...whereBase,
            originalTransactionId: Like(`%${query.transactionId}%`),
          },
        ]
      : [whereBase];

    const [subscriptions, total] =
      await this.subscriptionRepository.findAndCount({
        where,
        relations: ['company'],
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

    return {
      data: subscriptions.map((subscription) =>
        this.mapSubscriptionResponse(subscription),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getSubscription(
    subscriptionId: string,
  ): Promise<AdminSubscriptionDetailDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['company', 'purchases'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription bulunamadı.');
    }

    return this.mapSubscriptionDetail(subscription);
  }

  async updateSubscription(
    subscriptionId: string,
    dto: AdminSubscriptionUpdateDto,
    actor: { id: string; email?: string },
  ): Promise<AdminSubscriptionDetailDto> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
      relations: ['company', 'purchases'],
    });

    if (!subscription) {
      throw new NotFoundException('Subscription bulunamadı.');
    }

    const nextStart = dto.periodStartAt
      ? new Date(dto.periodStartAt)
      : subscription.periodStartAt;
    const nextEnd = dto.periodEndAt
      ? new Date(dto.periodEndAt)
      : subscription.periodEndAt;

    if (nextStart && nextEnd && nextStart > nextEnd) {
      throw new BadRequestException(
        'Abonelik başlangıç tarihi bitiş tarihinden sonra olamaz.',
      );
    }

    const previousSnapshot = { ...subscription };

    if (dto.planCode) {
      subscription.planCode = dto.planCode;
    }
    if (dto.status) {
      subscription.status = dto.status;
    }
    if (dto.platform) {
      subscription.platform = dto.platform;
    }
    if (dto.environment) {
      subscription.environment = dto.environment;
    }
    if (dto.renewalStatus) {
      subscription.renewalStatus = dto.renewalStatus;
    }
    if (dto.autoRenewing !== undefined) {
      subscription.autoRenewing = dto.autoRenewing;
    }
    if (dto.periodStartAt) {
      subscription.periodStartAt = nextStart;
    }
    if (dto.periodEndAt) {
      subscription.periodEndAt = nextEnd;
    }
    if (dto.productId !== undefined) {
      subscription.productId = dto.productId;
    }
    if (dto.transactionId !== undefined) {
      subscription.transactionId = dto.transactionId;
    }
    if (dto.originalTransactionId !== undefined) {
      subscription.originalTransactionId = dto.originalTransactionId;
    }
    if (dto.provider !== undefined) {
      subscription.provider = dto.provider;
    }
    if (dto.providerSubscriptionId !== undefined) {
      subscription.providerSubscriptionId = dto.providerSubscriptionId;
    }

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);

    await this.auditLogService.createLog(
      'admin_update_subscription',
      'Subscription',
      savedSubscription.id,
      previousSnapshot,
      savedSubscription,
      AuditLogType.SUCCESS,
      actor,
    );

    return this.mapSubscriptionDetail(savedSubscription);
  }

  async listPurchases(
    query: AdminPurchaseQueryDto,
  ): Promise<PaginatedResponse<AdminPurchaseResponseDto>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const where: FindOptionsWhere<SubscriptionPurchase> = {};

    if (query.companyId) {
      where.company = { id: query.companyId };
    }
    if (query.subscriptionId) {
      where.subscription = { id: query.subscriptionId };
    }
    if (query.platform) {
      where.platform = query.platform;
    }
    if (query.productId) {
      where.productId = query.productId;
    }
    if (query.transactionId) {
      where.transactionId = Like(`%${query.transactionId}%`);
    }

    const [purchases, total] = await this.purchaseRepository.findAndCount({
      where,
      relations: ['company', 'subscription'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: purchases.map((purchase) => this.mapPurchaseResponse(purchase)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getPurchase(purchaseId: string): Promise<AdminPurchaseResponseDto> {
    const purchase = await this.purchaseRepository.findOne({
      where: { id: purchaseId },
      relations: ['company', 'subscription'],
    });

    if (!purchase) {
      throw new NotFoundException('Subscription purchase bulunamadı.');
    }

    return this.mapPurchaseResponse(purchase);
  }

  listStoreProducts(): AdminStoreProductDto[] {
    return listStoreProductMappings().map((mapping) => ({
      platform: mapping.platform,
      planCode: mapping.planCode,
      productId: mapping.productId,
      envKey: mapping.envKey,
      source: mapping.source,
    }));
  }

  private mapSubscriptionResponse(
    subscription: Subscription,
  ): AdminSubscriptionResponseDto {
    return {
      id: subscription.id,
      companyId: subscription.company?.id ?? '',
      planCode: subscription.planCode,
      status: subscription.status,
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
      provider: subscription.provider,
      providerSubscriptionId: subscription.providerSubscriptionId,
      createdAt: subscription.createdAt?.toISOString(),
      updatedAt: subscription.updatedAt?.toISOString(),
    };
  }

  private mapSubscriptionDetail(
    subscription: Subscription,
  ): AdminSubscriptionDetailDto {
    return {
      ...this.mapSubscriptionResponse(subscription),
      purchases: subscription.purchases?.map((purchase) =>
        this.mapPurchaseResponse(purchase),
      ),
    };
  }

  private mapPurchaseResponse(
    purchase: SubscriptionPurchase,
  ): AdminPurchaseResponseDto {
    return {
      id: purchase.id,
      companyId: purchase.company?.id ?? '',
      subscriptionId: purchase.subscription?.id ?? '',
      platform: purchase.platform,
      productId: purchase.productId,
      transactionId: purchase.transactionId,
      originalTransactionId: purchase.originalTransactionId,
      purchaseToken: purchase.purchaseToken,
      receipt: purchase.receipt,
      environment: purchase.environment,
      renewalStatus: purchase.renewalStatus,
      purchasedAt: purchase.purchasedAt?.toISOString(),
      expiresAt: purchase.expiresAt?.toISOString(),
      rawPayload: purchase.rawPayload,
      providerSubscriptionId: purchase.providerSubscriptionId,
      source: purchase.source,
      createdAt: purchase.createdAt?.toISOString(),
    };
  }
}
