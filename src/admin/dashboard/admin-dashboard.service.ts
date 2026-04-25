import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { Company } from 'src/entities/company.entity';
import { Branch } from 'src/entities/branch.entity';
import { Team } from 'src/entities/team.entity';
import { Membership } from 'src/entities/membership.entity';
import { Subscription, SubscriptionStatus } from 'src/entities/subscription.entity';
import { AdminDashboardSummaryResponseDto } from './dto/admin-dashboard-summary-response.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchesRepository: Repository<Branch>,
    @InjectRepository(Team)
    private readonly teamsRepository: Repository<Team>,
    @InjectRepository(Membership)
    private readonly membershipsRepository: Repository<Membership>,
    @InjectRepository(Subscription)
    private readonly subscriptionsRepository: Repository<Subscription>,
  ) {}

  async getSummary(): Promise<AdminDashboardSummaryResponseDto> {
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      totalPermissions,
      totalCompanies,
      totalBranches,
      totalTeams,
      totalMemberships,
      activeSubscriptions,
    ] = await Promise.all([
      this.usersRepository.count({ withDeleted: true }),
      this.usersRepository.count({ where: { deletedAt: IsNull() } }),
      this.usersRepository.count({
        where: { deletedAt: Not(IsNull()) },
        withDeleted: true,
      }),
      this.rolesRepository.count({ withDeleted: true }),
      this.permissionsRepository.count({ withDeleted: true }),
      this.companiesRepository.count(),
      this.branchesRepository.count(),
      this.teamsRepository.count(),
      this.membershipsRepository.count(),
      this.subscriptionsRepository.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalRoles,
      totalPermissions,
      totalCompanies,
      totalBranches,
      totalTeams,
      totalMemberships,
      activeSubscriptions,
    };
  }
}
