import { Module } from '@nestjs/common';
import { TenancyController } from './tenancy.controller';
import { TenancyService } from './tenancy.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from 'src/entities/company.entity';
import { Branch } from 'src/entities/branch.entity';
import { Team } from 'src/entities/team.entity';
import { Membership } from 'src/entities/membership.entity';
import { BillingModule } from 'src/billing/billing.module';
import { User } from 'src/entities/user.entity';
import { BranchContextGuard } from './guards/branch-context.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company, Branch, Team, Membership, User]),
    BillingModule,
  ],
  controllers: [TenancyController],
  providers: [TenancyService, BranchContextGuard],
  exports: [TenancyService, BranchContextGuard],
})
export class TenancyModule {}
