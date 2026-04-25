import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Not } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { Company } from 'src/entities/company.entity';
import { Branch } from 'src/entities/branch.entity';
import { Team } from 'src/entities/team.entity';
import { Membership } from 'src/entities/membership.entity';
import {
  Subscription,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';
import { AdminDashboardService } from './admin-dashboard.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;

  const usersRepository = { count: jest.fn() };
  const rolesRepository = { count: jest.fn() };
  const permissionsRepository = { count: jest.fn() };
  const companiesRepository = { count: jest.fn() };
  const branchesRepository = { count: jest.fn() };
  const teamsRepository = { count: jest.fn() };
  const membershipsRepository = { count: jest.fn() };
  const subscriptionsRepository = { count: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: getRepositoryToken(User), useValue: usersRepository },
        { provide: getRepositoryToken(Role), useValue: rolesRepository },
        {
          provide: getRepositoryToken(Permission),
          useValue: permissionsRepository,
        },
        { provide: getRepositoryToken(Company), useValue: companiesRepository },
        { provide: getRepositoryToken(Branch), useValue: branchesRepository },
        { provide: getRepositoryToken(Team), useValue: teamsRepository },
        {
          provide: getRepositoryToken(Membership),
          useValue: membershipsRepository,
        },
        {
          provide: getRepositoryToken(Subscription),
          useValue: subscriptionsRepository,
        },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns aggregated dashboard metrics', async () => {
    usersRepository.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(20);
    rolesRepository.count.mockResolvedValueOnce(5);
    permissionsRepository.count.mockResolvedValueOnce(18);
    companiesRepository.count.mockResolvedValueOnce(3);
    branchesRepository.count.mockResolvedValueOnce(7);
    teamsRepository.count.mockResolvedValueOnce(11);
    membershipsRepository.count.mockResolvedValueOnce(52);
    subscriptionsRepository.count.mockResolvedValueOnce(2);

    const result = await service.getSummary();

    expect(result).toEqual({
      totalUsers: 100,
      activeUsers: 80,
      inactiveUsers: 20,
      totalRoles: 5,
      totalPermissions: 18,
      totalCompanies: 3,
      totalBranches: 7,
      totalTeams: 11,
      totalMemberships: 52,
      activeSubscriptions: 2,
    });

    expect(usersRepository.count).toHaveBeenNthCalledWith(1, {
      withDeleted: true,
    });
    expect(usersRepository.count).toHaveBeenNthCalledWith(2, {
      where: { deletedAt: IsNull() },
    });
    expect(usersRepository.count).toHaveBeenNthCalledWith(3, {
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
    });
    expect(subscriptionsRepository.count).toHaveBeenCalledWith({
      where: { status: SubscriptionStatus.ACTIVE },
    });
  });
});
