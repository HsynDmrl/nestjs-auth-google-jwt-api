import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { Permission } from 'src/entities/permission.entity';
import { UsersModule } from 'src/users/users.module';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { AuditLogModule } from 'src/audit-log/audit-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Permission]), 
  AuditLogModule,UsersModule],
  providers: [PermissionsService, PermissionsGuard],
  controllers: [PermissionsController],
  exports: [PermissionsService, TypeOrmModule, PermissionsGuard],
})
export class PermissionsModule {}
