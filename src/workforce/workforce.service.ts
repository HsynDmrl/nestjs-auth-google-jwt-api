import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { Branch } from 'src/entities/branch.entity';
import { ShiftAssignment } from 'src/entities/shift-assignment.entity';
import { ShiftTemplate } from 'src/entities/shift-template.entity';
import { User } from 'src/entities/user.entity';
import { WeeklySchedule } from 'src/entities/weekly-schedule.entity';
import { Repository } from 'typeorm';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { CreateWeeklyScheduleDto } from './dto/create-weekly-schedule.dto';
import {
  BadRequestException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

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

  private validateTemplateAgainstLaborRules(
    startTime: string,
    endTime: string,
  ): void {
    const duration = this.getShiftDurationMinutes(startTime, endTime);

    if (duration <= 0) {
      throw new BadRequestException('Vardiya başlangıcı bitişten önce olmalı.');
    }

    if (duration > WorkforceService.DAILY_MAX_MINUTES) {
      throw new BadRequestException(
        'Türkiye çalışma kurallarına göre bir vardiya 11 saati aşamaz.',
      );
    }

    if (
      this.shiftTouchesNightHours(startTime, endTime) &&
      duration > WorkforceService.NIGHT_SHIFT_MAX_MINUTES
    ) {
      throw new BadRequestException(
        'Gece dönemi içeren vardiya 7.5 saati aşamaz.',
      );
    }
  }

  private validateScheduleRange(
    weekStartDate: string,
    weekEndDate: string,
  ): void {
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
      throw new BadRequestException(
        'Haftalık vardiya planı tam 7 gün (başlangıç + 6 gün) olmalıdır.',
      );
    }
  }

  private async assertUserWeeklyHourLimit(
    scheduleId: string,
    userId: string,
    candidateTemplate: ShiftTemplate,
  ): Promise<void> {
    const assignments = await this.shiftAssignmentRepository.find({
      where: {
        weeklySchedule: { id: scheduleId },
        user: { id: userId },
      },
      relations: ['shiftTemplate'],
    });

    const currentTotalMinutes = assignments.reduce(
      (sum, assignment) =>
        sum +
        this.getShiftDurationMinutes(
          assignment.shiftTemplate.startTime,
          assignment.shiftTemplate.endTime,
        ),
      0,
    );
    const nextTotalMinutes =
      currentTotalMinutes +
      this.getShiftDurationMinutes(
        candidateTemplate.startTime,
        candidateTemplate.endTime,
      );

    if (nextTotalMinutes > WorkforceService.WEEKLY_MAX_MINUTES) {
      throw new UnprocessableEntityException(
        'Haftalık toplam çalışma süresi 45 saati aşamaz.',
      );
    }
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
  ): Promise<ShiftTemplate> {
    const branch = await this.assertShiftFeature(
      createShiftTemplateDto.branchId,
    );
    this.validateTemplateAgainstLaborRules(
      createShiftTemplateDto.startTime,
      createShiftTemplateDto.endTime,
    );

    const template = this.shiftTemplateRepository.create({
      branch,
      name: createShiftTemplateDto.name.trim(),
      startTime: createShiftTemplateDto.startTime,
      endTime: createShiftTemplateDto.endTime,
    });
    return this.shiftTemplateRepository.save(template);
  }

  async createWeeklySchedule(
    createWeeklyScheduleDto: CreateWeeklyScheduleDto,
  ): Promise<WeeklySchedule> {
    const branch = await this.assertShiftFeature(
      createWeeklyScheduleDto.branchId,
    );

    this.validateScheduleRange(
      createWeeklyScheduleDto.weekStartDate,
      createWeeklyScheduleDto.weekEndDate,
    );

    const schedule = this.weeklyScheduleRepository.create({
      branch,
      weekStartDate: createWeeklyScheduleDto.weekStartDate,
      weekEndDate: createWeeklyScheduleDto.weekEndDate,
    });
    return this.weeklyScheduleRepository.save(schedule);
  }

  async assignShift(
    createShiftAssignmentDto: CreateShiftAssignmentDto,
  ): Promise<ShiftAssignment> {
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

    await this.assertUserWeeklyHourLimit(schedule.id, user.id, template);

    const assignment = this.shiftAssignmentRepository.create({
      weeklySchedule: schedule,
      shiftTemplate: template,
      user,
      dayOfWeek: createShiftAssignmentDto.dayOfWeek,
    });
    return this.shiftAssignmentRepository.save(assignment);
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
}
