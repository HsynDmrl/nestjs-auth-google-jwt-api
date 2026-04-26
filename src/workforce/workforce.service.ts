import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { Branch } from 'src/entities/branch.entity';
import { ShiftAssignment } from 'src/entities/shift-assignment.entity';
import { ShiftTemplate } from 'src/entities/shift-template.entity';
import { TipSession, TipSessionStatus } from 'src/entities/tip-session.entity';
import { User } from 'src/entities/user.entity';
import { WeeklySchedule } from 'src/entities/weekly-schedule.entity';
import { Between, Repository } from 'typeorm';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { CreateWeeklyScheduleDto } from './dto/create-weekly-schedule.dto';

export interface WorkforceWarning {
  code: string;
  message: string;
  userId?: string;
}

export interface ShiftTemplateResult {
  template: ShiftTemplate;
  warnings: WorkforceWarning[];
}

export interface WeeklyScheduleResult {
  schedule: WeeklySchedule;
  warnings: WorkforceWarning[];
}

export interface ShiftAssignmentResult {
  assignment: ShiftAssignment;
  warnings: WorkforceWarning[];
  userWeeklyTotalMinutes: number;
  userOvertimeMinutes: number;
}

export interface WorkforceWeeklyUserReport {
  userId: string;
  name: string;
  surname: string;
  totalWorkMinutes: number;
  overtimeMinutes: number;
  tipTotalsByCurrency: Record<string, number>;
  warnings: WorkforceWarning[];
}

export interface WorkforceWeeklyReportResult {
  scheduleId: string;
  branchId: string;
  weekStartDate: string;
  weekEndDate: string;
  warnings: WorkforceWarning[];
  users: WorkforceWeeklyUserReport[];
}

@Injectable()
export class WorkforceService {
  private static readonly DAILY_MAX_MINUTES = 11 * 60;
  private static readonly NIGHT_SHIFT_MAX_MINUTES = 7.5 * 60;
  private static readonly WEEKLY_MAX_MINUTES = 45 * 60;
  private static readonly NIGHT_START_MINUTES = 20 * 60;
  private static readonly NIGHT_END_MINUTES = 6 * 60;

  constructor(
    @InjectRepository(ShiftTemplate)
    private readonly shiftTemplateRepository: Repository<ShiftTemplate>,
    @InjectRepository(WeeklySchedule)
    private readonly weeklyScheduleRepository: Repository<WeeklySchedule>,
    @InjectRepository(ShiftAssignment)
    private readonly shiftAssignmentRepository: Repository<ShiftAssignment>,
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TipSession)
    private readonly tipSessionRepository: Repository<TipSession>,
    private readonly billingService: BillingService,
  ) {}

  private parseTimeToMinutes(time: string): number {
    const [hour, minute] = time.split(':').map((value) => Number(value));
    return hour * 60 + minute;
  }

  private getShiftDurationMinutes(startTime: string, endTime: string): number {
    const start = this.parseTimeToMinutes(startTime);
    const end = this.parseTimeToMinutes(endTime);
    return end - start;
  }

  private shiftTouchesNightHours(startTime: string, endTime: string): boolean {
    const start = this.parseTimeToMinutes(startTime);
    const end = this.parseTimeToMinutes(endTime);
    const overlapsEarlyNight =
      start < WorkforceService.NIGHT_END_MINUTES && end > 0 && end > start;
    const overlapsLateNight =
      start < 24 * 60 && end > WorkforceService.NIGHT_START_MINUTES;
    return overlapsEarlyNight || overlapsLateNight;
  }

  private collectTemplateWarnings(
    startTime: string,
    endTime: string,
  ): WorkforceWarning[] {
    const duration = this.getShiftDurationMinutes(startTime, endTime);

    if (duration <= 0) {
      throw new BadRequestException('Vardiya başlangıcı bitişten önce olmalı.');
    }

    const warnings: WorkforceWarning[] = [];
    if (duration > WorkforceService.DAILY_MAX_MINUTES) {
      warnings.push({
        code: 'SHIFT_DAILY_LIMIT_EXCEEDED',
        message:
          'Vardiya süresi 11 saatin üzerinde. Yasal mesai sınırları için kontrol önerilir.',
      });
    }

    if (
      this.shiftTouchesNightHours(startTime, endTime) &&
      duration > WorkforceService.NIGHT_SHIFT_MAX_MINUTES
    ) {
      warnings.push({
        code: 'SHIFT_NIGHT_LIMIT_EXCEEDED',
        message:
          'Gece dönemine temas eden vardiya 7.5 saatin üzerinde. Gece mesaisi uygunluğunu kontrol edin.',
      });
    }

    return warnings;
  }

  private collectScheduleWarnings(
    weekStartDate: string,
    weekEndDate: string,
  ): WorkforceWarning[] {
    const start = new Date(weekStartDate);
    const end = new Date(weekEndDate);

    if (start > end) {
      throw new BadRequestException(
        'Hafta başlangıcı hafta sonundan büyük olamaz.',
      );
    }

    const dayDiff = Math.floor(
      (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (dayDiff !== 6) {
      return [
        {
          code: 'SCHEDULE_NOT_7_DAYS',
          message:
            'Plan aralığı tam 7 gün değil. Raporlama ve mesai takibi için 7 günlük plan önerilir.',
        },
      ];
    }

    return [];
  }

  private async getUserWeeklyTotalMinutes(
    scheduleId: string,
    userId: string,
  ): Promise<number> {
    const assignments = await this.shiftAssignmentRepository.find({
      where: {
        weeklySchedule: { id: scheduleId },
        user: { id: userId },
      },
      relations: ['shiftTemplate'],
    });

    return assignments.reduce(
      (sum, assignment) =>
        sum +
        this.getShiftDurationMinutes(
          assignment.shiftTemplate.startTime,
          assignment.shiftTemplate.endTime,
        ),
      0,
    );
  }

  private buildWeeklyLimitWarning(
    userId: string,
    totalMinutes: number,
  ): WorkforceWarning[] {
    if (totalMinutes <= WorkforceService.WEEKLY_MAX_MINUTES) {
      return [];
    }

    return [
      {
        code: 'USER_WEEKLY_LIMIT_EXCEEDED',
        userId,
        message:
          'Kullanıcının haftalık toplam süresi 45 saati aşıyor. Fazla mesai kontrolü önerilir.',
      },
    ];
  }

  private async assertShiftFeature(branchId: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      relations: ['company'],
    });
    if (!branch) {
      throw new NotFoundException('Şube bulunamadı.');
    }
    await this.billingService.assertTenantActionAllowed(
      branch.company.id,
      'manage_workforce',
    );
    return branch;
  }

  async createShiftTemplate(
    createShiftTemplateDto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplateResult> {
    const branch = await this.assertShiftFeature(
      createShiftTemplateDto.branchId,
    );
    const warnings = this.collectTemplateWarnings(
      createShiftTemplateDto.startTime,
      createShiftTemplateDto.endTime,
    );

    const template = this.shiftTemplateRepository.create({
      branch,
      name: createShiftTemplateDto.name.trim(),
      startTime: createShiftTemplateDto.startTime,
      endTime: createShiftTemplateDto.endTime,
    });

    const savedTemplate = await this.shiftTemplateRepository.save(template);
    return { template: savedTemplate, warnings };
  }

  async createWeeklySchedule(
    createWeeklyScheduleDto: CreateWeeklyScheduleDto,
  ): Promise<WeeklyScheduleResult> {
    const branch = await this.assertShiftFeature(
      createWeeklyScheduleDto.branchId,
    );

    const warnings = this.collectScheduleWarnings(
      createWeeklyScheduleDto.weekStartDate,
      createWeeklyScheduleDto.weekEndDate,
    );

    const schedule = this.weeklyScheduleRepository.create({
      branch,
      weekStartDate: createWeeklyScheduleDto.weekStartDate,
      weekEndDate: createWeeklyScheduleDto.weekEndDate,
    });
    const savedSchedule = await this.weeklyScheduleRepository.save(schedule);
    return { schedule: savedSchedule, warnings };
  }

  async assignShift(
    createShiftAssignmentDto: CreateShiftAssignmentDto,
  ): Promise<ShiftAssignmentResult> {
    const schedule = await this.weeklyScheduleRepository.findOne({
      where: { id: createShiftAssignmentDto.weeklyScheduleId },
      relations: ['branch', 'branch.company'],
    });
    if (!schedule) {
      throw new NotFoundException('Haftalık plan bulunamadı.');
    }

    await this.billingService.assertTenantActionAllowed(
      schedule.branch.company.id,
      'manage_workforce',
    );

    const template = await this.shiftTemplateRepository.findOne({
      where: {
        id: createShiftAssignmentDto.shiftTemplateId,
        branch: { id: schedule.branch.id },
      },
      relations: ['branch'],
    });
    if (!template) {
      throw new NotFoundException('Vardiya şablonu bulunamadı.');
    }

    const user = await this.userRepository.findOne({
      where: { id: createShiftAssignmentDto.userId },
    });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }

    const existingAssignment = await this.shiftAssignmentRepository.findOne({
      where: {
        weeklySchedule: { id: schedule.id },
        user: { id: user.id },
        dayOfWeek: createShiftAssignmentDto.dayOfWeek,
      },
      relations: ['shiftTemplate'],
    });
    if (existingAssignment) {
      throw new UnprocessableEntityException(
        'Kullanıcı bu gün için zaten vardiyaya atanmış.',
      );
    }

    const previousTotalMinutes = await this.getUserWeeklyTotalMinutes(
      schedule.id,
      user.id,
    );
    const shiftMinutes = this.getShiftDurationMinutes(
      template.startTime,
      template.endTime,
    );
    const userWeeklyTotalMinutes = previousTotalMinutes + shiftMinutes;
    const userOvertimeMinutes = Math.max(
      userWeeklyTotalMinutes - WorkforceService.WEEKLY_MAX_MINUTES,
      0,
    );

    const warnings: WorkforceWarning[] = [
      ...this.collectTemplateWarnings(template.startTime, template.endTime),
      ...this.buildWeeklyLimitWarning(user.id, userWeeklyTotalMinutes),
    ];

    const assignment = this.shiftAssignmentRepository.create({
      weeklySchedule: schedule,
      shiftTemplate: template,
      user,
      dayOfWeek: createShiftAssignmentDto.dayOfWeek,
    });
    const savedAssignment =
      await this.shiftAssignmentRepository.save(assignment);

    return {
      assignment: savedAssignment,
      warnings,
      userWeeklyTotalMinutes,
      userOvertimeMinutes,
    };
  }

  async listWeeklySchedule(scheduleId: string): Promise<WeeklySchedule> {
    const schedule = await this.weeklyScheduleRepository.findOne({
      where: { id: scheduleId },
      relations: [
        'branch',
        'assignments',
        'assignments.user',
        'assignments.shiftTemplate',
      ],
    });
    if (!schedule) {
      throw new NotFoundException('Haftalık plan bulunamadı.');
    }
    return schedule;
  }

  async getWeeklyScheduleReport(
    scheduleId: string,
  ): Promise<WorkforceWeeklyReportResult> {
    const schedule = await this.weeklyScheduleRepository.findOne({
      where: { id: scheduleId },
      relations: [
        'branch',
        'assignments',
        'assignments.user',
        'assignments.shiftTemplate',
      ],
    });
    if (!schedule) {
      throw new NotFoundException('Haftalık plan bulunamadı.');
    }

    const users = new Map<string, WorkforceWeeklyUserReport>();
    for (const assignment of schedule.assignments ?? []) {
      const userId = assignment.user.id;
      const current = users.get(userId) ?? {
        userId,
        name: assignment.user.name,
        surname: assignment.user.surname,
        totalWorkMinutes: 0,
        overtimeMinutes: 0,
        tipTotalsByCurrency: {},
        warnings: [],
      };
      current.totalWorkMinutes += this.getShiftDurationMinutes(
        assignment.shiftTemplate.startTime,
        assignment.shiftTemplate.endTime,
      );
      users.set(userId, current);
    }

    const periodStart = new Date(`${schedule.weekStartDate}T00:00:00.000Z`);
    const periodEnd = new Date(`${schedule.weekEndDate}T23:59:59.999Z`);
    const tipSessions = await this.tipSessionRepository.find({
      where: {
        branch: { id: schedule.branch.id },
        status: TipSessionStatus.CLOSED,
        startedAt: Between(periodStart, periodEnd),
      },
      relations: ['distributions', 'distributions.user'],
    });

    for (const session of tipSessions) {
      for (const distribution of session.distributions ?? []) {
        const report = users.get(distribution.user.id);
        if (!report) {
          continue;
        }
        report.tipTotalsByCurrency[distribution.currencyCode] =
          (report.tipTotalsByCurrency[distribution.currencyCode] ?? 0) +
          distribution.amountMinorUnit;
      }
    }

    for (const report of users.values()) {
      report.overtimeMinutes = Math.max(
        report.totalWorkMinutes - WorkforceService.WEEKLY_MAX_MINUTES,
        0,
      );
      report.warnings = this.buildWeeklyLimitWarning(
        report.userId,
        report.totalWorkMinutes,
      );
    }

    return {
      scheduleId: schedule.id,
      branchId: schedule.branch.id,
      weekStartDate: schedule.weekStartDate,
      weekEndDate: schedule.weekEndDate,
      warnings: this.collectScheduleWarnings(
        schedule.weekStartDate,
        schedule.weekEndDate,
      ),
      users: [...users.values()],
    };
  }
}
