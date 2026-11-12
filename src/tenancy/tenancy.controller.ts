import {
  Body,
  Controller,
  Get,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { MoveTeamDto } from './dto/move-team.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { BranchContextGuard } from './guards/branch-context.guard';
import { RequestWithTenantContext } from './interfaces/tenant-context.interface';
import { TenancyService } from './tenancy.service';
import { BillingService } from 'src/billing/billing.service';

@ApiBearerAuth('access-token')
@ApiTags('Tenancy')
@Controller('tenancy')
@UseGuards(JwtAuthGuard)
export class TenancyController {
  constructor(
    private readonly tenancyService: TenancyService,
    private readonly billingService: BillingService,
  ) {}

  @Post('companies')
  @UseGuards(PermissionsGuard)
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Yeni company oluşturur.' })
  createCompany(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createCompanyDto: CreateCompanyDto,
  ) {
    return this.tenancyService.createCompany(createCompanyDto);
  }

  @Post('branches')
  @ApiOperation({ summary: 'Company altında yeni şube oluşturur.' })
  createBranch(
    @Req() request: RequestWithTenantContext,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createBranchDto: CreateBranchDto,
  ) {
    return this.tenancyService.createBranch(
      request.user?.id ?? '',
      createBranchDto,
    );
  }

  @Post('teams')
  @ApiOperation({ summary: 'Şube altında yeni takım oluşturur.' })
  createTeam(
    @Req() request: RequestWithTenantContext,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createTeamDto: CreateTeamDto,
  ) {
    return this.tenancyService.createTeam(
      request.user?.id ?? '',
      createTeamDto,
    );
  }

  @Post('memberships')
  @ApiOperation({ summary: 'Kullanıcıyı takıma üye olarak ekler.' })
  createMembership(
    @Req() request: RequestWithTenantContext,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createMembershipDto: CreateMembershipDto,
  ) {
    return this.tenancyService.createMembership(
      request.user?.id ?? '',
      createMembershipDto,
    );
  }

  @Post('teams/move')
  @ApiOperation({ summary: 'Takımı aynı company içinde farklı şubeye taşır.' })
  moveTeam(
    @Req() request: RequestWithTenantContext,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    moveTeamDto: MoveTeamDto,
  ) {
    return this.tenancyService.moveTeam(request.user?.id ?? '', moveTeamDto);
  }

  @Get('companies/:companyId/capabilities')
  @UseGuards(BranchContextGuard)
  @ApiOperation({
    summary:
      'Tenant UI için plan/capability bilgisini döner (hangi aksiyonlar açık/kapalı).',
  })
  async getCompanyCapabilities(
    @Req() request: RequestWithTenantContext,
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ) {
    if (request.tenantContext?.companyId !== companyId) {
      throw new ForbiddenException(
        'Farklı bir tenant için capability sorgulanamaz.',
      );
    }

    return this.billingService.getCompanyCapabilitySnapshot(companyId);
  }

  @Get('context/active-branch')
  @UseGuards(BranchContextGuard)
  @ApiOperation({
    summary:
      'Aktif şube context bilgisini döner (x-branch-id header ile çalışır).',
  })
  getActiveBranchContext(@Req() request: RequestWithTenantContext) {
    return request.tenantContext;
  }
}
