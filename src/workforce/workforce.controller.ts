import {
  Body,
  Controller,
  Get,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { BranchContextGuard } from 'src/tenancy/guards/branch-context.guard';
import { RequestWithTenantContext } from 'src/tenancy/interfaces/tenant-context.interface';
import { CreateShiftAssignmentDto } from './dto/create-shift-assignment.dto';
import { CreateShiftTemplateDto } from './dto/create-shift-template.dto';
import { CreateWeeklyScheduleDto } from './dto/create-weekly-schedule.dto';
import { WorkforceService } from './workforce.service';
import { RequiresFeature } from 'src/billing/decorators/requires-feature.decorator';
import { RequiresFeatureGuard } from 'src/billing/guards/requires-feature.guard';

@ApiBearerAuth('access-token')
@ApiTags('Workforce')
@Controller('workforce')
@UseGuards(JwtAuthGuard, BranchContextGuard, RequiresFeatureGuard)
@RequiresFeature('shiftManagementEnabled')
@ApiHeader({
  name: 'x-branch-id',
  required: true,
  description: 'Aktif şube kimliği',
})
export class WorkforceController {
  constructor(private readonly workforceService: WorkforceService) {}

  @Post('shift-templates')
  @ApiOperation({ summary: 'Yeni vardiya şablonu oluşturur.' })
  createShiftTemplate(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createShiftTemplateDto: CreateShiftTemplateDto,
    @Req() request: RequestWithTenantContext,
  ) {
    if (request.tenantContext?.branchId !== createShiftTemplateDto.branchId) {
      throw new ForbiddenException(
        'İstek şube contexti ile payload branchId uyuşmuyor.',
      );
    }
    return this.workforceService.createShiftTemplate(createShiftTemplateDto);
  }

  @Post('weekly-schedules')
  @ApiOperation({ summary: 'Yeni haftalık vardiya planı oluşturur.' })
  createWeeklySchedule(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createWeeklyScheduleDto: CreateWeeklyScheduleDto,
    @Req() request: RequestWithTenantContext,
  ) {
    if (request.tenantContext?.branchId !== createWeeklyScheduleDto.branchId) {
      throw new ForbiddenException(
        'İstek şube contexti ile payload branchId uyuşmuyor.',
      );
    }
    return this.workforceService.createWeeklySchedule(createWeeklyScheduleDto);
  }

  @Post('assignments')
  @ApiOperation({ summary: 'Kullanıcıyı haftalık plana atar.' })
  createAssignment(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createShiftAssignmentDto: CreateShiftAssignmentDto,
  ) {
    return this.workforceService.assignShift(createShiftAssignmentDto);
  }

  @Get('weekly-schedules/:scheduleId')
  @ApiOperation({ summary: 'Haftalık planı atamalarla birlikte getirir.' })
  getWeeklySchedule(
    @Param('scheduleId', new ParseUUIDPipe({ version: '4' }))
    scheduleId: string,
  ) {
    return this.workforceService.listWeeklySchedule(scheduleId);
  }

  @Get('weekly-schedules/:scheduleId/report')
  @ApiOperation({
    summary:
      'Haftalık çalışan istatistiğini getirir (çalışma süresi, fazla mesai, tip dağıtımı).',
  })
  getWeeklyScheduleReport(
    @Param('scheduleId', new ParseUUIDPipe({ version: '4' }))
    scheduleId: string,
  ) {
    return this.workforceService.getWeeklyScheduleReport(scheduleId);
  }
}
