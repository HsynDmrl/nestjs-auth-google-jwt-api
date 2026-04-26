import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from 'src/entities/company.entity';
import {
  PlanCode,
  Subscription,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;
  let subscriptionRepository: { findOne: jest.Mock };
  let companyRepository: { findOneOrFail: jest.Mock };
  let auditLogService: { createLog: jest.Mock };

  beforeEach(async () => {
    subscriptionRepository = { findOne: jest.fn() };
    companyRepository = { findOneOrFail: jest.fn() };
    auditLogService = { createLog: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepository,
        },
        { provide: getRepositoryToken(Company), useValue: companyRepository },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    companyRepository.findOneOrFail.mockResolvedValue({ id: 'company-1' });
  });

  it('falls back to FREE and read-only when no active subscription exists', async () => {
    subscriptionRepository.findOne.mockResolvedValue(null);

    const snapshot = await service.getCompanyCapabilitySnapshot('company-1');

    expect(snapshot.plan).toBe(PlanCode.FREE);
    expect(snapshot.features.readOnlyMode).toBe(false);
    expect(snapshot.readOnlyReason).toBe('NONE');
  });

  it('falls back to FREE when subscription period is expired', async () => {
    subscriptionRepository.findOne.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
      planCode: PlanCode.ENTERPRISE,
      periodEndAt: new Date(Date.now() - 1000),
    });

    const snapshot = await service.getCompanyCapabilitySnapshot('company-1');

    expect(snapshot.plan).toBe(PlanCode.FREE);
    expect(snapshot.readOnlyReason).toBe('SUBSCRIPTION_EXPIRED');
  });

  it('enables branch/team move capabilities only for enterprise plan', async () => {
    subscriptionRepository.findOne.mockResolvedValue({
      status: SubscriptionStatus.ACTIVE,
      planCode: PlanCode.ENTERPRISE,
      periodEndAt: new Date(Date.now() + 60_000),
    });

    const snapshot = await service.getCompanyCapabilitySnapshot('company-1');

    expect(snapshot.features.canCreateBranch).toBe(true);
    expect(snapshot.features.canCreateTeam).toBe(true);
    expect(snapshot.features.canMoveTeam).toBe(true);
  });

  it('blocks write action when plan is read-only', async () => {
    subscriptionRepository.findOne.mockResolvedValue(null);

    await expect(
      service.assertTenantActionAllowed('company-1', 'create_branch'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
