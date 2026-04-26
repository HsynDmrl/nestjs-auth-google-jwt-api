import {
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { Branch } from 'src/entities/branch.entity';
import { ShiftAssignment } from 'src/entities/shift-assignment.entity';
import { ShiftTemplate } from 'src/entities/shift-template.entity';
import { User } from 'src/entities/user.entity';
import { WeeklySchedule } from 'src/entities/weekly-schedule.entity';
import { WorkforceService } from './workforce.service';

describe('WorkforceService', () => {
  let service: WorkforceService;
  let shiftTemplateRepository: any;
  let weeklyScheduleRepository: any;
  let shiftAssignmentRepository: any;
  let branchRepository: any;
  let userRepository: any;
  let billingService: { assertTenantActionAllowed: jest.Mock };

  beforeEach(async () => {
    shiftTemplateRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
    };
    weeklyScheduleRepository = {
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
      findOne: jest.fn(),
    };
    shiftAssignmentRepository = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => value),
    };
    branchRepository = { findOne: jest.fn() };
    userRepository = { findOne: jest.fn() };
    billingService = { assertTenantActionAllowed: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkforceService,
        {
          provide: getRepositoryToken(ShiftTemplate),
          useValue: shiftTemplateRepository,
        },
        {
          provide: getRepositoryToken(WeeklySchedule),
          useValue: weeklyScheduleRepository,
        },
        {
          provide: getRepositoryToken(ShiftAssignment),
          useValue: shiftAssignmentRepository,
        },
        { provide: getRepositoryToken(Branch), useValue: branchRepository },
        { provide: getRepositoryToken(User), useValue: userRepository },
        { provide: BillingService, useValue: billingService },
      ],
    }).compile();

    service = module.get<WorkforceService>(WorkforceService);
    branchRepository.findOne.mockResolvedValue({
      id: 'branch-1',
      company: { id: 'company-1' },
    });
  });

  it('rejects shift template longer than 11 hours', async () => {
    await expect(
      service.createShiftTemplate({
        branchId: 'branch-1',
        name: 'Uzun Vardiya',
        startTime: '08:00',
        endTime: '20:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects night shift template longer than 7.5 hours', async () => {
    await expect(
      service.createShiftTemplate({
        branchId: 'branch-1',
        name: 'Gece Vardiyası',
        startTime: '00:00',
        endTime: '08:00',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects weekly schedule that is not exactly 7 days', async () => {
    await expect(
      service.createWeeklySchedule({
        branchId: 'branch-1',
        weekStartDate: '2026-05-18',
        weekEndDate: '2026-05-27',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects assignment when weekly total exceeds 45 hours', async () => {
    weeklyScheduleRepository.findOne.mockResolvedValue({
      id: 'schedule-1',
      branch: { id: 'branch-1', company: { id: 'company-1' } },
    });
    shiftTemplateRepository.findOne.mockResolvedValue({
      id: 'template-1',
      startTime: '09:00',
      endTime: '17:00',
      branch: { id: 'branch-1' },
    });
    userRepository.findOne.mockResolvedValue({ id: 'user-1' });
    shiftAssignmentRepository.findOne.mockResolvedValue(null);
    shiftAssignmentRepository.find.mockResolvedValue([
      { shiftTemplate: { startTime: '09:00', endTime: '17:00' } },
      { shiftTemplate: { startTime: '09:00', endTime: '17:00' } },
      { shiftTemplate: { startTime: '09:00', endTime: '17:00' } },
      { shiftTemplate: { startTime: '09:00', endTime: '17:00' } },
      { shiftTemplate: { startTime: '09:00', endTime: '17:00' } },
    ]);

    await expect(
      service.assignShift({
        weeklyScheduleId: 'schedule-1',
        shiftTemplateId: 'template-1',
        userId: 'user-1',
        dayOfWeek: 6,
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
