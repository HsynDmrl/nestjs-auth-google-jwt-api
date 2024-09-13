import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersService } from './admin-users.service';
import { AdminUsersController } from './admin-users.controller';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { AuthModule } from 'src/auth/auth.module'; 
import { UsersModule } from 'src/users/users.module';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { ModelMapperModule } from 'src/model-mapper/model-mapper.module';
import { AdminUsersBusinessLogic } from './admin-users-business.logic';
import { AdminRolesModule } from '../roles/admin-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role]),
    AuditLogModule,
    AuthModule,
    UsersModule,
    ModelMapperModule, 
    AdminRolesModule,
  ],
  providers: [
    AdminUsersService,
    AdminUsersBusinessLogic,],
  controllers: [AdminUsersController],
  exports: [AdminUsersService, AdminUsersBusinessLogic],
})
export class AdminUsersModule {}
