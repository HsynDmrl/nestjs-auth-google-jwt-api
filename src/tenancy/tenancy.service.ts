import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { Branch } from 'src/entities/branch.entity';
import { Company } from 'src/entities/company.entity';
import { Membership, MembershipRole } from 'src/entities/membership.entity';
import { Team } from 'src/entities/team.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
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
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto): Promise<Company> {
    const company = this.companyRepository.create({
      name: createCompanyDto.name.trim(),
    });
    return this.companyRepository.save(company);
  }

  async createBranch(createBranchDto: CreateBranchDto): Promise<Branch> {
    const company = await this.companyRepository.findOne({
      where: { id: createBranchDto.companyId },
    });
    if (!company) {
      throw new NotFoundException('Company bulunamadı.');
    }

    const branch = this.branchRepository.create({
      company,
      name: createBranchDto.name.trim(),
    });
    return this.branchRepository.save(branch);
  }

  async createTeam(createTeamDto: CreateTeamDto): Promise<Team> {
    const branch = await this.branchRepository.findOne({
      where: { id: createTeamDto.branchId },
      relations: ['company'],
    });
    if (!branch) {
      throw new NotFoundException('Branch bulunamadı.');
    }

    const team = this.teamRepository.create({
      branch,
      name: createTeamDto.name.trim(),
    });
    return this.teamRepository.save(team);
  }

  async createMembership(
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
