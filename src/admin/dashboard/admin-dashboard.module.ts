import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { Company } from 'src/entities/company.entity';
import { Branch } from 'src/entities/branch.entity';
import { Team } from 'src/entities/team.entity';
import { Membership } from 'src/entities/membership.entity';
import { Subscription } from 'src/entities/subscription.entity';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Role,
      Permission,
      Company,
      Branch,
      Team,
      Membership,
      Subscription,
    ]),
  ],
  controllers: [AdminDashboardController],
  providers: [AdminDashboardService],
})
export class AdminDashboardModule {}
