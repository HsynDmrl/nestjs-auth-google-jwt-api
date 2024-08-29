import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog, AuditLogType } from 'src/entities/audit-log.entity';
import { UserActivity } from 'src/entities/user-activity.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
  ) {}
  
  async findAll(): Promise<AuditLog[]> {
    return this.auditLogRepository.find();
  }
  
  async createLog(
    action: string,
    entity: string,
    entityId: string,
    oldValue: any,
    newValue: any,
    type: AuditLogType,
    user: Partial<User>,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      type,
      user,
    });
    return this.auditLogRepository.save(auditLog);
  }

  async logActivity(
    user: User,
    action: string,
    type: AuditLogType,
    ipAddress: string,
    country: string,
    city: string,
  ): Promise<UserActivity> {
    const activity = this.userActivityRepository.create({
      user,
      action,
      type,
      ipAddress,
      country,
      city,
    });
    return this.userActivityRepository.save(activity);
  }

  async findLoginLogsByUserId(userId: string): Promise<UserActivity[]> {
  const logs = await this.userActivityRepository.find({
    where: {
      user: {
        id: userId,
      },
      action: 'login',
    },
    order: { createdAt: 'DESC' },
    relations: ['user'],
  });

  console.log('Login Logs for User ID:', userId, logs); // Sorgunun sonucunu konsola yazdırın

  return logs;
}

async findActivitiesByUserId(userId: string): Promise<UserActivity[]> {
  return this.userActivityRepository.find({
    where: {
      user: {
        id: userId,
      },
    },
    order: { createdAt: 'DESC' },
    relations: ['user'],
  });
}
  
}
