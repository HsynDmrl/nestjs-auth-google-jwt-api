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

import * as session from 'express-session';
import { ModelMapperService } from './model-mapper/model-mapper.service';

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
  ],
  controllers: [AppController],
  providers: [AppService, ModelMapperService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        session({
          secret: process.env.SECRET_KEY,
          resave: false,
          saveUninitialized: false,
          cookie: { maxAge: 3600000 }, // 1 saatlik oturum süresi
        }),
      )
      .forRoutes('*')
  }
}
