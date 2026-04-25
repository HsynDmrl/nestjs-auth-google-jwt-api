import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/entities/subscription.entity';
import { Company } from 'src/entities/company.entity';
import { RequiresFeatureGuard } from './guards/requires-feature.guard';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, Company]), AuditLogModule],
  controllers: [BillingController],
  providers: [BillingService, RequiresFeatureGuard],
  exports: [BillingService, RequiresFeatureGuard],
})
export class BillingModule {}
