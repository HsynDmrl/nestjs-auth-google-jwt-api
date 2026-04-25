import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { Branch } from 'src/entities/branch.entity';
import { Company } from 'src/entities/company.entity';
import { Membership } from 'src/entities/membership.entity';
import { Team } from 'src/entities/team.entity';
import { User } from 'src/entities/user.entity';
import { DataSource } from 'typeorm';
import { TenancyService } from './tenancy.service';

describe('TenancyService', () => {
  let service: TenancyService;
  let teamRepository: { findOne: jest.Mock };
  let branchRepository: { findOne: jest.Mock };
  let membershipRepository: { findOne: jest.Mock };
  let billingService: { assertTenantActionAllowed: jest.Mock };

  beforeEach(async () => {
    teamRepository = { findOne: jest.fn() };
    branchRepository = { findOne: jest.fn() };
    membershipRepository = { findOne: jest.fn() };
    billingService = { assertTenantActionAllowed: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenancyService,
        { provide: getRepositoryToken(Company), useValue: {} },
        { provide: getRepositoryToken(Branch), useValue: branchRepository },
        { provide: getRepositoryToken(Team), useValue: teamRepository },
        {
          provide: getRepositoryToken(Membership),
          useValue: {
            ...membershipRepository,
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        { provide: getRepositoryToken(User), useValue: {} },
        { provide: BillingService, useValue: billingService },
        {
          provide: DataSource,
          useValue: {
            transaction: async (callback: any) =>
              callback({
                getRepository: () => ({
                  merge: (_: any, next: any) => next,
                  save: async (value: any) => value,
                  createQueryBuilder: () => ({
                    update: () => ({
                      set: () => ({
                        where: () => ({
                          execute: async () => undefined,
                        }),
                      }),
                    }),
                  }),
                }),
              }),
          },
        },
      ],
    }).compile();

    service = module.get<TenancyService>(TenancyService);
  });

  it('rejects moving team to a different company', async () => {
    membershipRepository.findOne.mockResolvedValue({
      id: 'manager-membership',
    });
    teamRepository.findOne.mockResolvedValue({
      id: 'team-1',
      branch: { id: 'branch-1', company: { id: 'company-1' } },
    });
    branchRepository.findOne.mockResolvedValue({
      id: 'branch-2',
      company: { id: 'company-2' },
    });

    await expect(
      service.moveTeam('user-1', {
        teamId: 'team-1',
        targetBranchId: 'branch-2',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('checks enterprise-only move team policy before move', async () => {
    membershipRepository.findOne.mockResolvedValue({
      id: 'manager-membership',
    });
    teamRepository.findOne.mockResolvedValue({
      id: 'team-1',
      branch: { id: 'branch-1', company: { id: 'company-1' } },
    });
    branchRepository.findOne.mockResolvedValue({
      id: 'branch-2',
      company: { id: 'company-1' },
    });

    await service.moveTeam('user-1', {
      teamId: 'team-1',
      targetBranchId: 'branch-2',
    });

    expect(billingService.assertTenantActionAllowed).toHaveBeenCalledWith(
      'company-1',
      'move_team',
    );
  });
});
