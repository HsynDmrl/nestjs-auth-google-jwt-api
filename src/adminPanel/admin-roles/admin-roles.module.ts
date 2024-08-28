import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRolesService } from './admin-roles.service';
import { AdminRolesController } from './admin-roles.controller';
import { Role } from 'src/entities/role.entity';
import { PermissionsModule } from '../permissions/permissions.module'; 
import { User } from 'src/entities/user.entity';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User]), 
    PermissionsModule,
  ],
  controllers: [AdminRolesController],
  providers: [
    AdminRolesService, 
    PermissionsGuard, 
    Reflector,
  ],
})
export class AdminRolesModule {}
