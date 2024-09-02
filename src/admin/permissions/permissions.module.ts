import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Permission } from 'src/entities/permission.entity';
import { UsersModule } from 'src/users/users.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { AuditLogModule } from 'src/audit-log/audit-log.module';
import { PermissionsBusinessLogic } from './permissions-business.logic';
import { ModelMapperModule } from 'src/model-mapper/model-mapper.module';
import { AdminRolesModule } from '../roles/admin-roles.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission]), 
    ModelMapperModule, 
    AuditLogModule, 
    UsersModule,
    forwardRef(() => AdminRolesModule),
  ],
  providers: [PermissionsService, PermissionsGuard, PermissionsBusinessLogic],
  controllers: [PermissionsController],
  exports: [PermissionsService, TypeOrmModule, PermissionsGuard],
})
export class PermissionsModule {}
