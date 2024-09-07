import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import { UserActivity } from 'src/entities/user-activity.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { CheckUserOrAdminGuard } from 'src/auth/decorators/permissions/check-user-or-admin.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth('access-token')
@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Tüm Logları Getir', description: 'Tüm audit loglarını getirir.' })
  @ApiResponse({ status: 200, description: 'Loglar başarıyla alındı.', type: [AuditLog] })
  async findAll(): Promise<AuditLog[]> {
    return this.auditLogService.findAll();
  }

  @Get('user-activities')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Tüm Kullanıcı Aktivitelerini Getir', description: 'Tüm kullanıcı aktivitelerini getirir.' })
  @ApiResponse({ status: 200, description: 'Kullanıcı aktiviteleri başarıyla alındı.', type: [UserActivity] })
  async findAllUserActivities(): Promise<UserActivity[]> {
    return this.auditLogService.findAllUserActivities();
  }

  @Get('user-activities/:userId')
  @UseGuards(CheckUserOrAdminGuard)
  @ApiOperation({ summary: 'Belirli Kullanıcının Aktivitelerini Getir', description: 'Belirtilen kullanıcıya ait aktiviteleri getirir.' })
  @ApiParam({ name: 'userId', description: 'Kullanıcı ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @ApiResponse({ status: 200, description: 'Kullanıcı aktiviteleri başarıyla alındı.', type: [UserActivity] })
  async findUserActivities(
    @Param('userId') userId: string
  ): Promise<UserActivity[]> {
    return this.auditLogService.findUserActivitiesByUserId(userId);
  }
}
