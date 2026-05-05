import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import {
  PlanCode,
  Subscription,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import { SubscriptionPurchase } from 'src/entities/subscription-purchase.entity';
import { AdminBillingService } from './admin-billing.service';

describe('AdminBillingService', () => {
  let service: AdminBillingService;
  let subscriptionRepository: {
    findAndCount: jest.Mock;
    findOne: jest.Mock;
    save: jest.Mock;
  };
  let purchaseRepository: { findAndCount: jest.Mock; findOne: jest.Mock };
  let auditLogService: { createLog: jest.Mock };

  beforeEach(async () => {
    subscriptionRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    };
    purchaseRepository = {
      findAndCount: jest.fn(),
      findOne: jest.fn(),
    };
    auditLogService = {
      createLog: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminBillingService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPurchase),
          useValue: purchaseRepository,
        },
        { provide: AuditLogService, useValue: auditLogService },
      ],
    }).compile();

    service = module.get(AdminBillingService);
  });

  it('lists subscriptions with pagination metadata', async () => {
    subscriptionRepository.findAndCount.mockResolvedValue([
      [
        {
          id: 'sub-1',
          company: { id: 'company-1' },
          planCode: PlanCode.STARTER,
          status: SubscriptionStatus.ACTIVE,
          periodStartAt: new Date('2026-04-01T00:00:00.000Z'),
          periodEndAt: new Date('2026-04-30T23:59:59.000Z'),
          createdAt: new Date('2026-04-01T00:00:00.000Z'),
          updatedAt: new Date('2026-04-10T00:00:00.000Z'),
        },
      ],
      1,
    ]);

    const result = await service.listSubscriptions({ page: 1, limit: 10 });

    expect(result.meta.total).toBe(1);
    expect(result.data[0].companyId).toBe('company-1');
  });

  it('updates subscription and writes audit log', async () => {
    const subscription = {
      id: 'sub-1',
      company: { id: 'company-1' },
      planCode: PlanCode.STARTER,
      status: SubscriptionStatus.ACTIVE,
      periodStartAt: new Date('2026-04-01T00:00:00.000Z'),
      periodEndAt: new Date('2026-04-30T23:59:59.000Z'),
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
      updatedAt: new Date('2026-04-10T00:00:00.000Z'),
      purchases: [],
    };

    subscriptionRepository.findOne.mockResolvedValue(subscription);
    subscriptionRepository.save.mockImplementation(async (value) => ({
      ...value,
      status: SubscriptionStatus.CANCELED,
    }));

    const result = await service.updateSubscription(
      'sub-1',
      { status: SubscriptionStatus.CANCELED },
      { id: 'admin-1' },
    );

    expect(subscriptionRepository.save).toHaveBeenCalled();
    expect(auditLogService.createLog).toHaveBeenCalled();
    expect(result.status).toBe(SubscriptionStatus.CANCELED);
  });
});
