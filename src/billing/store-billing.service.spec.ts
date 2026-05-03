import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { Company } from 'src/entities/company.entity';
import { Membership } from 'src/entities/membership.entity';
import {
  PlanCode,
  Subscription,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionRenewalStatus,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import { SubscriptionPurchase } from 'src/entities/subscription-purchase.entity';
import { AppStoreProvider } from './providers/app-store.provider';
import { GooglePlayProvider } from './providers/google-play.provider';
import { StoreBillingService } from './store-billing.service';

describe('StoreBillingService', () => {
  let service: StoreBillingService;
  let subscriptionRepository: {
    findOne: jest.Mock;
    save: jest.Mock;
    create: jest.Mock;
  };
  let purchaseRepository: { save: jest.Mock; create: jest.Mock };
  let companyRepository: { findOne: jest.Mock; findOneOrFail: jest.Mock };
  let membershipRepository: { findOne: jest.Mock };
  let auditLogService: { createLog: jest.Mock };
  let googlePlayProvider: { platform: SubscriptionPlatform; verifyPurchase: jest.Mock };
  let appStoreProvider: { platform: SubscriptionPlatform; verifyPurchase: jest.Mock };

  beforeEach(async () => {
    subscriptionRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn((value) => ({ ...value })),
    };
    purchaseRepository = {
      save: jest.fn(),
      create: jest.fn((value) => ({ ...value })),
    };
    companyRepository = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
    };
    membershipRepository = {
      findOne: jest.fn(),
    };
    auditLogService = {
      createLog: jest.fn(),
    };
    googlePlayProvider = {
      platform: SubscriptionPlatform.GOOGLE_PLAY,
      verifyPurchase: jest.fn(),
    };
    appStoreProvider = {
      platform: SubscriptionPlatform.APP_STORE,
      verifyPurchase: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreBillingService,
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionRepository,
        },
        {
          provide: getRepositoryToken(SubscriptionPurchase),
          useValue: purchaseRepository,
        },
        { provide: getRepositoryToken(Company), useValue: companyRepository },
        { provide: getRepositoryToken(Membership), useValue: membershipRepository },
        { provide: AuditLogService, useValue: auditLogService },
        { provide: GooglePlayProvider, useValue: googlePlayProvider },
        { provide: AppStoreProvider, useValue: appStoreProvider },
      ],
    }).compile();

    service = module.get(StoreBillingService);
  });

  it('returns FREE status when no subscription exists', async () => {
    companyRepository.findOneOrFail.mockResolvedValue({ id: 'company-1' });
    subscriptionRepository.findOne.mockResolvedValue(null);

    const status = await service.getCompanySubscriptionStatus('company-1');

    expect(status.planCode).toBe(PlanCode.FREE);
    expect(status.status).toBe(SubscriptionStatus.EXPIRED);
  });

  it('verifies purchase and returns updated status', async () => {
    membershipRepository.findOne.mockResolvedValue({
      id: 'membership-1',
      company: { id: 'company-1' },
    });
    companyRepository.findOne.mockResolvedValue({ id: 'company-1' });
    subscriptionRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    googlePlayProvider.verifyPurchase.mockResolvedValue({
      planCode: PlanCode.PRO,
      platform: SubscriptionPlatform.GOOGLE_PLAY,
      productId: 'demo.google.pro',
      transactionId: 'GPA.1234',
      originalTransactionId: 'GPA.1234',
      purchaseToken: 'token',
      receipt: null,
      environment: SubscriptionEnvironment.PRODUCTION,
      renewalStatus: SubscriptionRenewalStatus.ACTIVE,
      autoRenewing: true,
      periodStartAt: new Date('2026-04-01T00:00:00.000Z'),
      periodEndAt: new Date('2026-04-30T00:00:00.000Z'),
      status: SubscriptionStatus.ACTIVE,
      providerSubscriptionId: 'GPA.1234',
    });

    subscriptionRepository.save.mockImplementation(async (value) => ({
      ...value,
      id: 'sub-1',
    }));

    const status = await service.verifyPurchase(
      {
        companyId: 'company-1',
        platform: SubscriptionPlatform.GOOGLE_PLAY,
        productId: 'demo.google.pro',
        transactionId: 'GPA.1234',
      },
      'user-1',
    );

    expect(subscriptionRepository.save).toHaveBeenCalled();
    expect(purchaseRepository.save).toHaveBeenCalled();
    expect(status.planCode).toBe(PlanCode.PRO);
    expect(status.platform).toBe(SubscriptionPlatform.GOOGLE_PLAY);
  });
});
