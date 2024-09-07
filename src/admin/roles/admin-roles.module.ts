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
import { AdminRolesBusinessLogic } from './admin-roles-business.logic';
import { PermissionsService } from '../permissions/permissions.service';
import { ModelMapperModule } from 'src/model-mapper/model-mapper.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, User]), 
    AuditLogModule,
    ModelMapperModule, 
    forwardRef(() => PermissionsModule),
  ],
  controllers: [AdminRolesController],
  providers: [ 
    AdminRolesBusinessLogic,
    AdminRolesService,
    PermissionsGuard,
    PermissionsService,
    Reflector,
  ],
  exports: [AdminRolesService, AdminRolesBusinessLogic],
})
export class AdminRolesModule {}
