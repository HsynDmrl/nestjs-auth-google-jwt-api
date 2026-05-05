import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { ClsService } from 'nestjs-cls';
import {
  AuditLog,
  AuditLogTenantContext,
  AuditLogType,
} from 'src/entities/audit-log.entity';
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
import { AUDIT_LOG_CONTEXT_KEY, AuditLogContext } from './audit-log-context';
import { AUDIT_LOG_CREATED_EVENT } from './audit-log.constants';
import { AuditLogEventPayload } from './audit-log.types';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(UserActivity)
    private userActivityRepository: Repository<UserActivity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly clsService: ClsService,
  ) {}

  async findAll(
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<AuditLog>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const [data, total] = await this.auditLogRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
    return {
      data,
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  emitLog(
    action: string,
    entity: string,
    entityId: string | null,
    oldValue: unknown | null,
    newValue: unknown | null,
    type: AuditLogType,
    user: Partial<User> | undefined,
    tenantContext?: AuditLogTenantContext | null,
  ): void {
    const context = this.clsService.get<AuditLogContext>(
      AUDIT_LOG_CONTEXT_KEY,
    );
    const payload: AuditLogEventPayload = {
      action,
      entity,
      entityId: entityId ?? null,
      oldValue: oldValue ?? null,
      newValue: newValue ?? null,
      type,
      userId: user?.id ?? context?.userId,
      tenantContext:
        tenantContext ?? (context
          ? { companyId: context.companyId, branchId: context.branchId }
          : null),
      ipAddress: context?.ipAddress ?? null,
      userAgent: context?.userAgent ?? null,
      deviceId: context?.deviceId ?? null,
    };

    this.eventEmitter.emit(AUDIT_LOG_CREATED_EVENT, payload);
  }

  @OnEvent(AUDIT_LOG_CREATED_EVENT, { async: true })
  async createLog(payload: AuditLogEventPayload): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId ?? null,
      oldValue: (payload.oldValue ?? null) as Record<string, unknown> | null,
      newValue: (payload.newValue ?? null) as Record<string, unknown> | null,
      type: payload.type ?? AuditLogType.SUCCESS,
      user: payload.userId ? ({ id: payload.userId } as User) : null,
      tenantContext: payload.tenantContext ?? null,
      ipAddress: payload.ipAddress ?? null,
      userAgent: payload.userAgent ?? null,
      deviceId: payload.deviceId ?? null,
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
