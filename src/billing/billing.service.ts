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

@Injectable()
export class BillingService {
  constructor(
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
  ) {}

  async getEffectivePlan(companyId: string): Promise<PlanCode> {
    await this.companyRepository.findOneOrFail({ where: { id: companyId } });

    const activeSubscription = await this.subscriptionRepository.findOne({
      where: {
        company: { id: companyId },
        status: SubscriptionStatus.ACTIVE,
      },
      order: { periodEndAt: 'DESC' },
      relations: ['company'],
    });

    return activeSubscription?.planCode ?? PlanCode.FREE;
  }

  async getFeatureSet(companyId: string): Promise<PlanFeatureSet> {
    const plan = await this.getEffectivePlan(companyId);
    return PLAN_FEATURES[plan];
  }

  async assertMemberLimit(companyId: string, memberCount: number): Promise<void> {
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
      where: {
        company: { id: upsertSubscriptionDto.companyId },
        status: SubscriptionStatus.ACTIVE,
      },
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
      providerSubscriptionId: upsertSubscriptionDto.providerSubscriptionId ?? null,
    });

    return this.subscriptionRepository.save(subscription);
  }
}
