import { Module } from '@nestjs/common';
import { WorkforceController } from './workforce.controller';
import { WorkforceService } from './workforce.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShiftTemplate } from 'src/entities/shift-template.entity';
import { WeeklySchedule } from 'src/entities/weekly-schedule.entity';
import { ShiftAssignment } from 'src/entities/shift-assignment.entity';
import { Branch } from 'src/entities/branch.entity';
import { User } from 'src/entities/user.entity';
import { BillingModule } from 'src/billing/billing.module';
import { TipSession } from 'src/entities/tip-session.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShiftTemplate,
      WeeklySchedule,
      ShiftAssignment,
      Branch,
      User,
      TipSession,
    ]),
    BillingModule,
  ],
  controllers: [WorkforceController],
  providers: [WorkforceService],
})
export class WorkforceModule {}
