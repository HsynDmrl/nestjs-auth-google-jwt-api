import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AdminUsersModule } from './adminPanel/admin-users/admin-users.module';
import { AuthModule } from './auth/auth.module';
import { AdminRolesModule } from './adminPanel/admin-roles/admin-roles.module';
import { SeedModule } from './seed/seed.module';
import { PermissionsService } from './adminPanel/permissions/permissions.service';
import { PermissionsController } from './adminPanel/permissions/permissions.controller';
import { PermissionsModule } from './adminPanel/permissions/permissions.module';

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
  ],
  controllers: [AppController, PermissionsController],
  providers: [AppService, PermissionsService],
})
export class AppModule {}
