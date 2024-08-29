import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import { UserActivity } from 'src/entities/user-activity.entity';

@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  // Tüm audit loglarını döndürür
  @Get()
  async findAll(): Promise<AuditLog[]> {
    return this.auditLogService.findAll();
  }

  // Belirli bir kullanıcıya ait login aktivitelerini döndürür
  @Get('user/login-logs/:userId')
  async findLoginLogsByUserId(@Param('userId') userId: string): Promise<UserActivity[]> {
    return this.auditLogService.findLoginLogsByUserId(userId);
  }

  // Belirli bir kullanıcıya ait tüm aktiviteleri döndürür
  @Get('user/activities/:userId')
  async findActivitiesByUserId(@Param('userId') userId: string): Promise<UserActivity[]> {
    return this.auditLogService.findActivitiesByUserId(userId);
  }
}
