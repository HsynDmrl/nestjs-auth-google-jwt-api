import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLog } from 'src/entities/audit-log.entity';
import { AuditLogController } from './audit-log.controller';
import { UserActivity } from 'src/entities/user-activity.entity';
import { UsersModule } from 'src/users/users.module';
import { AuditLogSubscriber } from './audit-log.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, UserActivity]), UsersModule],
  providers: [AuditLogService, AuditLogSubscriber],
  controllers: [AuditLogController],
  exports: [AuditLogService],
})
export class AuditLogModule {}
