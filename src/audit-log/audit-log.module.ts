import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import { AuditLogController } from './audit-log.controller';
import { UserActivity } from 'src/entities/user-activity.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, UserActivity])],
  providers: [AuditLogService],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
