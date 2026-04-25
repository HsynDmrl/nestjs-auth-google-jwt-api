import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { AuditLogService } from 'src/audit-log/audit-log.service';
import { AuditLogType } from 'src/entities/audit-log.entity';
import { Branch } from 'src/entities/branch.entity';
import { Company } from 'src/entities/company.entity';
import { Membership, MembershipRole } from 'src/entities/membership.entity';
import { Team } from 'src/entities/team.entity';
import { User } from 'src/entities/user.entity';
import { DataSource, In, Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { MoveTeamDto } from './dto/move-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { TenantContext } from './interfaces/tenant-context.interface';

@Injectable()
export class TenancyService {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(Team)
    private readonly teamRepository: Repository<Team>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly billingService: BillingService,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create({
      name: createCompanyDto.name.trim(),
    });
    return this.companyRepository.save(company);
  }

  private async assertTenantManagerAccess(
    userId: string,
    companyId: string,
  ): Promise<void> {
    const managerMembership = await this.membershipRepository.findOne({
      where: {
        user: { id: userId },
        company: { id: companyId },
        isActive: true,
        role: In([MembershipRole.OWNER, MembershipRole.BRANCH_MANAGER]),
      },
      relations: ['user', 'company'],
    });

    if (!managerMembership) {
      throw new ForbiddenException(
        'Bu tenant üzerinde yönetim işlemi yapmak için OWNER veya BRANCH_MANAGER rolüne sahip olmalısınız.',
      );
    }
  }

  async createBranch(
    userId: string,
    createBranchDto: CreateBranchDto,
  ): Promise<Branch> {
    const company = await this.companyRepository.findOne({
      where: { id: createBranchDto.companyId },
    });
    if (!company) {
      throw new NotFoundException('Company bulunamadı.');
    }

    await this.assertTenantManagerAccess(userId, company.id);
    await this.billingService.assertTenantActionAllowed(
      company.id,
      'create_branch',
    );

    const branch = this.branchRepository.create({
      company,
      name: createBranchDto.name.trim(),
    });
    return this.branchRepository.save(branch);
  }

  async createTeam(
    userId: string,
    createTeamDto: CreateTeamDto,
  ): Promise<Team> {
    const branch = await this.branchRepository.findOne({
      where: { id: createTeamDto.branchId },
      relations: ['company'],
    });
    if (!branch) {
      throw new NotFoundException('Branch bulunamadı.');
    }

    await this.assertTenantManagerAccess(userId, branch.company.id);
    await this.billingService.assertTenantActionAllowed(
      branch.company.id,
      'create_team',
    );

    const team = this.teamRepository.create({
      branch,
      name: createTeamDto.name.trim(),
    });
    return this.teamRepository.save(team);
  }

  async createMembership(
    userId: string,
    createMembershipDto: CreateMembershipDto,
  ): Promise<Membership> {
    const user = await this.userRepository.findOne({
      where: { id: createMembershipDto.userId },
    });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const team = await this.teamRepository.findOne({
      where: { id: createMembershipDto.teamId },
      relations: ['branch', 'branch.company'],
    });
    if (!team) {
      throw new NotFoundException('Team bulunamadı.');
    }

    await this.assertTenantManagerAccess(userId, team.branch.company.id);
    await this.billingService.assertTenantActionAllowed(
      team.branch.company.id,
      'manage_membership',
    );

    const existingActiveMembers = await this.membershipRepository.count({
      where: { branch: { id: team.branch.id }, isActive: true },
      relations: ['branch'],
    });

    await this.billingService.assertMemberLimit(
      team.branch.company.id,
      existingActiveMembers + 1,
    );

    const membership = this.membershipRepository.create({
      user,
      company: team.branch.company,
      branch: team.branch,
      team,
      role: createMembershipDto.role ?? MembershipRole.STAFF,
      isActive: createMembershipDto.isActive ?? true,
    });

    return this.membershipRepository.save(membership);
  }

  async moveTeam(userId: string, moveTeamDto: MoveTeamDto): Promise<Team> {
    const team = await this.teamRepository.findOne({
      where: { id: moveTeamDto.teamId },
      relations: ['branch', 'branch.company'],
    });
    if (!team) {
      throw new NotFoundException('Taşınacak takım bulunamadı.');
    }

    const targetBranch = await this.branchRepository.findOne({
      where: { id: moveTeamDto.targetBranchId },
      relations: ['company'],
    });
    if (!targetBranch) {
      throw new NotFoundException('Hedef şube bulunamadı.');
    }

    if (team.branch.company.id !== targetBranch.company.id) {
      throw new ForbiddenException(
        'Takım yalnızca aynı company içerisindeki bir şubeye taşınabilir.',
      );
    }

    await this.assertTenantManagerAccess(userId, team.branch.company.id);
    await this.billingService.assertTenantActionAllowed(
      team.branch.company.id,
      'move_team',
    );

    const movedTeam = await this.dataSource.transaction(async (manager) => {
      const nextTeam = manager.getRepository(Team).merge(team, {
        branch: targetBranch,
      });
      const updatedTeam = await manager.getRepository(Team).save(nextTeam);

      await manager
        .getRepository(Membership)
        .createQueryBuilder()
        .update(Membership)
        .set({ branch: targetBranch })
        .where('"teamId" = :teamId', { teamId: team.id })
        .execute();

      return updatedTeam;
    });

    await this.auditLogService.createLog(
      'move_team',
      'Team',
      team.id,
      { fromBranchId: team.branch.id },
      { toBranchId: targetBranch.id },
      AuditLogType.SUCCESS,
      { id: userId },
    );

    return movedTeam;
  }

  async resolveTenantContext(
    userId: string,
    branchId: string,
  ): Promise<TenantContext> {
    if (!userId) {
      throw new BadRequestException('Kullanıcı kimliği gereklidir.');
    }

    const membership = await this.membershipRepository.findOne({
      where: {
        user: { id: userId },
        branch: { id: branchId },
        isActive: true,
      },
      relations: ['company', 'branch', 'team', 'user'],
    });

    if (!membership) {
      throw new NotFoundException(
        'Kullanıcı bu şubede aktif üyeliğe sahip değil.',
      );
    }

    return {
      userId,
      companyId: membership.company.id,
      branchId: membership.branch.id,
      teamId: membership.team.id,
      membershipId: membership.id,
      membershipRole: membership.role,
    };
  }
}
