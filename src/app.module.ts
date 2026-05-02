import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AdminUsersModule } from './admin/users/admin-users.module';
import { AdminRolesModule } from './admin/roles/admin-roles.module';
import { AuthModule } from './auth/auth.module';
import { SeedModule } from './seed/seed.module';
import { PermissionsModule } from './admin/permissions/permissions.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { CaptchaModule } from './captcha/captcha.module';
import { TipSessionsModule } from './tip-sessions/tip-sessions.module';
import { TipEntriesModule } from './tip-entries/tip-entries.module';
import { DistributionsModule } from './distributions/distributions.module';

import * as session from 'express-session';
import { APP_FILTER } from '@nestjs/core';
import { GlobalExceptionFilter } from './core/exceptions/filters/global-exception.filter'; // Filter'ı da ekliyoruz
import { ModelMapperService } from './model-mapper/model-mapper.service';
import { TenancyModule } from './tenancy/tenancy.module';
import { BillingModule } from './billing/billing.module';
import { WorkforceModule } from './workforce/workforce.module';
import { AdminDashboardModule } from './admin/dashboard/admin-dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AdminUsersModule,
    AuthModule,
    AdminRolesModule,
    SeedModule,
    PermissionsModule,
    AuditLogModule,
    CaptchaModule,
    TipSessionsModule,
    TipEntriesModule,
    DistributionsModule,
    TenancyModule,
    BillingModule,
    WorkforceModule,
    AdminDashboardModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    ModelMapperService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        session({
          secret: process.env.SECRET_KEY,
          resave: false,
          saveUninitialized: false,
          cookie: {
            maxAge: 3600000, // 1 saatlik oturum süresi
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
          },
        }),
      )
      .forRoutes('*');
  }
}
