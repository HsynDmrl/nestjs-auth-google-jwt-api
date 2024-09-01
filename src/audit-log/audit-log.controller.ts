import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import { UserActivity } from 'src/entities/user-activity.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { CheckUserOrAdminGuard } from 'src/auth/decorators/permissions/check-user-or-admin.decorator';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions('admin_read_users')
  async findAll(): Promise<AuditLog[]> {
    return this.auditLogService.findAll();
  }

  @Get('user-activities')
  @Permissions('admin_read_users')
  async findAllUserActivities(): Promise<UserActivity[]> {
    return this.auditLogService.findAllUserActivities();
  }

  @Get('user-activities/:userId')
  @UseGuards(CheckUserOrAdminGuard)
  async findUserActivities(
    @Param('userId') userId: string
  ): Promise<UserActivity[]> {
    return this.auditLogService.findUserActivitiesByUserId(userId);
  }
}
