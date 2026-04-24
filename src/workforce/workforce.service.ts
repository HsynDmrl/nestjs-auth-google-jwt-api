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

  private async assertShiftFeature(branchId: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id: branchId },
      relations: ['company'],
    });
    if (!branch) {
      throw new NotFoundException('Şube bulunamadı.');
    }
    await this.billingService.assertFeatureEnabled(
      branch.company.id,
      'shiftManagementEnabled',
    );
    return branch;
  }

  async createShiftTemplate(
    createShiftTemplateDto: CreateShiftTemplateDto,
  ): Promise<ShiftTemplate> {
    const branch = await this.assertShiftFeature(createShiftTemplateDto.branchId);

    if (createShiftTemplateDto.startTime >= createShiftTemplateDto.endTime) {
      throw new BadRequestException('Vardiya başlangıcı bitişten önce olmalı.');
    }

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
    const branch = await this.assertShiftFeature(createWeeklyScheduleDto.branchId);

    if (createWeeklyScheduleDto.weekStartDate > createWeeklyScheduleDto.weekEndDate) {
      throw new BadRequestException('Hafta başlangıcı hafta sonundan büyük olamaz.');
    }

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

    await this.billingService.assertFeatureEnabled(
      schedule.branch.company.id,
      'shiftManagementEnabled',
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
      relations: ['branch', 'assignments', 'assignments.user', 'assignments.shiftTemplate'],
    });
    if (!schedule) {
      throw new NotFoundException('Haftalık plan bulunamadı.');
    }
    return schedule;
  }
}
