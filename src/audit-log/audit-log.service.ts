import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuditLog, AuditLogType } from 'src/entities/audit-log.entity';
import { UserActivity } from 'src/entities/user-activity.entity';
import { User } from 'src/entities/user.entity';
import { Repository } from 'typeorm';
import * as requestIp from 'request-ip';
import * as geoip from 'geoip-lite';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import {
  buildPaginationMeta,
  normalizePagination,
} from 'src/common/utils/pagination.util';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [data, total] = await this.auditLogRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
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

  async logUserActivity(
    user: User,
    request: any,
    type: AuditLogType,
  ): Promise<UserActivity> {
    const clientIp = requestIp.getClientIp(request); // IP adresini al
    const geo = geoip.lookup(clientIp); // GeoIP ile ülke ve şehir bilgilerini al

    const userActivity = this.userActivityRepository.create({
      action: 'LOGIN',
      ipAddress: clientIp,
      country: geo?.country || 'Unknown',
      city: geo?.city || 'Unknown',
      type,
      user,
    });

    return this.userActivityRepository.save(userActivity);
  }

  async findAllUserActivities(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<UserActivity>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [data, total] = await this.userActivityRepository.findAndCount({
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async findUserActivitiesByUserId(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<UserActivity>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [data, total] = await this.userActivityRepository.findAndCount({
      where: { user: { id: userId } },
      relations: ['user'],
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  // Başarısız giriş denemesini kaydetme
  async logFailedLogin(user: User, ipAddress: string): Promise<UserActivity> {
    const geo = geoip.lookup(ipAddress); // GeoIP ile ülke ve şehir bilgilerini al

    const failedLogin = this.userActivityRepository.create({
      action: 'FAILED_LOGIN',
      ipAddress: ipAddress || 'Unknown', // IP adresini kaydet
      country: geo?.country || 'Unknown', // Ülke bilgisi
      city: geo?.city || 'Unknown', // Şehir bilgisi
      type: AuditLogType.FAILURE, // Başarısızlık türü
      user,
    });

    // createdAt otomatik olarak kaydedilecektir
    return this.userActivityRepository.save(failedLogin);
  }
}
