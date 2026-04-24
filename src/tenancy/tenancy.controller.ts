import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { BranchContextGuard } from './guards/branch-context.guard';
import { RequestWithTenantContext } from './interfaces/tenant-context.interface';
import { TenancyService } from './tenancy.service';

@ApiBearerAuth('access-token')
@ApiTags('Tenancy')
@Controller('tenancy')
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Post('companies')
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
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createBranchDto: CreateBranchDto,
  ) {
    return this.tenancyService.createBranch(createBranchDto);
  }

  @Post('teams')
  @ApiOperation({ summary: 'Şube altında yeni takım oluşturur.' })
  createTeam(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createTeamDto: CreateTeamDto,
  ) {
    return this.tenancyService.createTeam(createTeamDto);
  }

  @Post('memberships')
  @ApiOperation({ summary: 'Kullanıcıyı takıma üye olarak ekler.' })
  createMembership(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createMembershipDto: CreateMembershipDto,
  ) {
    return this.tenancyService.createMembership(createMembershipDto);
  }

  @Get('context/active-branch')
  @UseGuards(JwtAuthGuard, BranchContextGuard)
  @ApiOperation({
    summary:
      'Aktif şube context bilgisini döner (x-branch-id header ile çalışır).',
  })
  getActiveBranchContext(@Req() request: RequestWithTenantContext) {
    return request.tenantContext;
  }
}
