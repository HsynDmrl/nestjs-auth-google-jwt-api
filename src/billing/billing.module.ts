import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from 'src/entities/subscription.entity';
import { Company } from 'src/entities/company.entity';
import { RequiresFeatureGuard } from './guards/requires-feature.guard';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { SubscriptionPurchase } from 'src/entities/subscription-purchase.entity';
import { AdminBillingService } from './admin-billing.service';
import { StoreBillingService } from './store-billing.service';
import { GooglePlayProvider } from './providers/google-play.provider';
import { AppStoreProvider } from './providers/app-store.provider';
import { StoreBillingController } from './store-billing.controller';
import { StoreBillingWebhookController } from './store-billing-webhook.controller';
import { Membership } from 'src/entities/membership.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subscription,
      Company,
      SubscriptionPurchase,
      Membership,
    ]),
    AuditLogModule,
  ],
  controllers: [
    BillingController,
    StoreBillingController,
    StoreBillingWebhookController,
  ],
  providers: [
    BillingService,
    AdminBillingService,
    StoreBillingService,
    RequiresFeatureGuard,
    GooglePlayProvider,
    AppStoreProvider,
  ],
  exports: [
    BillingService,
    AdminBillingService,
    StoreBillingService,
    RequiresFeatureGuard,
  ],
})
export class BillingModule {}
