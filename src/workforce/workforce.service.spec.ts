import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BillingService } from 'src/billing/billing.service';
import { Branch } from 'src/entities/branch.entity';
import { ShiftAssignment } from 'src/entities/shift-assignment.entity';
import { ShiftTemplate } from 'src/entities/shift-template.entity';
import { TipSession } from 'src/entities/tip-session.entity';
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
  let tipSessionRepository: any;
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
    tipSessionRepository = { find: jest.fn() };
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
        {
          provide: getRepositoryToken(TipSession),
          useValue: tipSessionRepository,
        },
        { provide: BillingService, useValue: billingService },
      ],
    }).compile();

    service = module.get<WorkforceService>(WorkforceService);
    branchRepository.findOne.mockResolvedValue({
      id: 'branch-1',
      company: { id: 'company-1' },
    });
  });

  it('creates template and returns warning when shift is longer than 11 hours', async () => {
    const result = await service.createShiftTemplate({
      branchId: 'branch-1',
      name: 'Uzun Vardiya',
      startTime: '08:00',
      endTime: '20:00',
    });

    expect(result.template.name).toBe('Uzun Vardiya');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SHIFT_DAILY_LIMIT_EXCEEDED' }),
      ]),
    );
  });

  it('creates template and returns warning when night shift is longer than 7.5 hours', async () => {
    const result = await service.createShiftTemplate({
      branchId: 'branch-1',
      name: 'Gece Vardiyası',
      startTime: '00:00',
      endTime: '08:00',
    });

    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SHIFT_NIGHT_LIMIT_EXCEEDED' }),
      ]),
    );
  });

  it('creates schedule and returns warning when range is not exactly 7 days', async () => {
    const result = await service.createWeeklySchedule({
      branchId: 'branch-1',
      weekStartDate: '2026-05-18',
      weekEndDate: '2026-05-27',
    });

    expect(result.schedule.weekStartDate).toBe('2026-05-18');
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SCHEDULE_NOT_7_DAYS' }),
      ]),
    );
  });

  it('assigns shift and returns warning when weekly total exceeds 45 hours', async () => {
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

    const result = await service.assignShift({
      weeklyScheduleId: 'schedule-1',
      shiftTemplateId: 'template-1',
      userId: 'user-1',
      dayOfWeek: 6,
    });

    expect(result.userWeeklyTotalMinutes).toBe(2880);
    expect(result.userOvertimeMinutes).toBe(180);
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'USER_WEEKLY_LIMIT_EXCEEDED' }),
      ]),
    );
  });
});
