import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipSession } from 'src/entities/tip-session.entity';
import { User } from 'src/entities/user.entity';
import { TipSessionsController } from './tip-sessions.controller';
import { TipSessionsService } from './tip-sessions.service';
import { Branch } from 'src/entities/branch.entity';
import { Team } from 'src/entities/team.entity';
import { Membership } from 'src/entities/membership.entity';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TipSession, User, Branch, Team, Membership]),
    BillingModule,
  ],
  controllers: [TipSessionsController],
  providers: [TipSessionsService],
  exports: [TipSessionsService, TypeOrmModule],
})
export class TipSessionsModule {}
