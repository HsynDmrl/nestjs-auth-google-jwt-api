import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRolesService } from './admin-roles.service';
import { AdminRolesController } from './admin-roles.controller';
import { Role } from 'src/entities/role.entity';
import { PermissionsModule } from '../permissions/permissions.module'; 
import { User } from 'src/entities/user.entity';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Reflector } from '@nestjs/core';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User]), 
    AuditLogModule,
    forwardRef(() => PermissionsModule),
  ],
  controllers: [AdminRolesController],
  providers: [
    AdminRolesService, 
    PermissionsGuard, 
    Reflector,
  ],
  exports: [AdminRolesService],
})
export class AdminRolesModule {}
