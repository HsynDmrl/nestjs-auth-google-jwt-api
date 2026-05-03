import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from 'src/entities/company.entity';
import {
  PlanCode,
  Subscription,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import { Repository } from 'typeorm';
import { PLAN_FEATURES, PlanFeatureSet } from './constants/plan-features';
import { ForbiddenException } from '@nestjs/common';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';
import { NotFoundException } from '@nestjs/common';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';
import { CompanySubscriptionStatusDto } from './dto/company-subscription-status.dto';

export type TenantAction =
  | 'create_branch'
  | 'create_team'
  | 'move_team'
  | 'manage_membership'
  | 'manage_workforce';

export interface CompanyCapabilitySnapshot {
  companyId: string;
  plan: PlanCode;
  features: PlanFeatureSet;
  readOnlyReason: 'NONE' | 'NO_ACTIVE_SUBSCRIPTION' | 'SUBSCRIPTION_EXPIRED';
  transitionAt?: string;
}

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    private readonly auditLogService: AuditLogService,
  ) {}

  private getActionPolicy(action: TenantAction): {
    capability: keyof PlanFeatureSet;
    forbiddenMessage: string;
  } {
    switch (action) {
      case 'create_branch':
        return {
          capability: 'canCreateBranch',
          forbiddenMessage:
            'Şube oluşturma yalnızca en üst pakette kullanılabilir.',
        };
      case 'create_team':
        return {
          capability: 'canCreateTeam',
          forbiddenMessage:
            'Takım oluşturma için ücretli bir paket gereklidir.',
        };
      case 'move_team':
        return {
          capability: 'canMoveTeam',
          forbiddenMessage:
            'Takım taşıma yalnızca en üst pakette kullanılabilir.',
        };
      case 'manage_membership':
        return {
          capability: 'canManageMembership',
          forbiddenMessage:
            'Üyelik yönetimi için ücretli bir paket gereklidir.',
        };
      case 'manage_workforce':
        return {
          capability: 'shiftManagementEnabled',
          forbiddenMessage:
            'Vardiya yönetimi için bu özellik paketinizde aktif olmalıdır.',
        };
    }
  }

  async getCompanyCapabilitySnapshot(
    companyId: string,
  ): Promise<CompanyCapabilitySnapshot> {
    await this.companyRepository.findOneOrFail({ where: { id: companyId } });
    const now = new Date();

    const currentSubscription = await this.subscriptionRepository.findOne({
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
      relations: ['company'],
    });

    if (!currentSubscription) {
      return {
        companyId,
        plan: PlanCode.FREE,
        features: PLAN_FEATURES[PlanCode.FREE],
        readOnlyReason: 'NONE',
      };
    }

    if (currentSubscription.periodEndAt < now) {
      return {
        companyId,
        plan: PlanCode.FREE,
        features: {
          ...PLAN_FEATURES[PlanCode.FREE],
          readOnlyMode: true,
          canCreateTeam: false,
          canManageMembership: false,
        },
        readOnlyReason: 'SUBSCRIPTION_EXPIRED',
        transitionAt: currentSubscription.periodEndAt.toISOString(),
      };
    }

    return {
      companyId,
      plan: currentSubscription.planCode,
      features: PLAN_FEATURES[currentSubscription.planCode],
      readOnlyReason: 'NONE',
    };
  }

  async getCompanySubscriptionStatus(
    companyId: string,
  ): Promise<CompanySubscriptionStatusDto> {
    await this.companyRepository.findOneOrFail({ where: { id: companyId } });
    const subscription = await this.subscriptionRepository.findOne({
      where: { company: { id: companyId } },
      order: { periodEndAt: 'DESC' },
    });

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

  async getEffectivePlan(companyId: string): Promise<PlanCode> {
    const snapshot = await this.getCompanyCapabilitySnapshot(companyId);
    return snapshot.plan;
  }

  async getFeatureSet(companyId: string): Promise<PlanFeatureSet> {
    const snapshot = await this.getCompanyCapabilitySnapshot(companyId);
    return snapshot.features;
  }

  async assertMemberLimit(
    companyId: string,
    memberCount: number,
  ): Promise<void> {
    const featureSet = await this.getFeatureSet(companyId);
    if (memberCount > featureSet.maxMembersPerBranch) {
      throw new ForbiddenException(
        `Plan limit aşıldı. Bu pakette en fazla ${featureSet.maxMembersPerBranch} kişi eklenebilir.`,
      );
    }
  }

  async assertFeatureEnabled(
    companyId: string,
    feature: keyof PlanFeatureSet,
  ): Promise<void> {
    const featureSet = await this.getFeatureSet(companyId);
    if (!featureSet[feature]) {
      throw new ForbiddenException(
        `Bu özellik mevcut planınızda aktif değil: ${feature}.`,
      );
    }
  }

  async assertTenantActionAllowed(
    companyId: string,
    action: TenantAction,
  ): Promise<void> {
    const snapshot = await this.getCompanyCapabilitySnapshot(companyId);
    const policy = this.getActionPolicy(action);

    if (snapshot.features.readOnlyMode) {
      throw new ForbiddenException(
        'Planınız şu anda read-only modda. Geçmiş verileri görüntüleyebilirsiniz ancak yazma işlemleri için ücretli pakete geçmelisiniz.',
      );
    }

    if (!snapshot.features[policy.capability]) {
      throw new ForbiddenException(policy.forbiddenMessage);
    }
  }

  async upsertSubscription(
    upsertSubscriptionDto: UpsertSubscriptionDto,
  ): Promise<Subscription> {
    const company = await this.companyRepository.findOne({
      where: { id: upsertSubscriptionDto.companyId },
    });
    if (!company) {
      throw new NotFoundException('Company bulunamadı.');
    }

    const existing = await this.subscriptionRepository.findOne({
      where: [
        {
          company: { id: upsertSubscriptionDto.companyId },
          status: SubscriptionStatus.ACTIVE,
        },
        {
          company: { id: upsertSubscriptionDto.companyId },
          status: SubscriptionStatus.GRACE_PERIOD,
        },
      ],
      relations: ['company'],
      order: { periodEndAt: 'DESC' },
    });

    if (existing) {
      existing.status = SubscriptionStatus.CANCELED;
      await this.subscriptionRepository.save(existing);
    }

    const subscription = this.subscriptionRepository.create({
      company,
      planCode: upsertSubscriptionDto.planCode,
      status: upsertSubscriptionDto.status ?? SubscriptionStatus.ACTIVE,
      periodStartAt: new Date(upsertSubscriptionDto.periodStartAt),
      periodEndAt: new Date(upsertSubscriptionDto.periodEndAt),
      provider: upsertSubscriptionDto.provider ?? null,
      providerSubscriptionId:
        upsertSubscriptionDto.providerSubscriptionId ?? null,
    });

    const savedSubscription =
      await this.subscriptionRepository.save(subscription);
    await this.auditLogService.createLog(
      'upsert_subscription',
      'Subscription',
      savedSubscription.id,
      existing ?? null,
      savedSubscription,
      AuditLogType.SUCCESS,
      { id: 'system', email: 'system@platform.local' },
    );

    return savedSubscription;
  }
}
