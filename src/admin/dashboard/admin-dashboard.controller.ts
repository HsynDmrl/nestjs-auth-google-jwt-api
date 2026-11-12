import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { AdminDashboardService } from './admin-dashboard.service';
import { AdminDashboardSummaryResponseDto } from './dto/admin-dashboard-summary-response.dto';

@ApiBearerAuth('access-token')
@ApiTags('Admin-Dashboard')
@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdminDashboardController {
  constructor(private readonly adminDashboardService: AdminDashboardService) {}

  @Get('summary')
  @Permissions('admin_read_users')
  @ApiOperation({
    summary: 'Admin panel özet metrikleri',
    description:
      'Admin panel dashboard ekranı için kullanıcı, rol, yetki, tenant ve abonelik metriklerini döner.',
  })
  @ApiResponse({
    status: 200,
    type: AdminDashboardSummaryResponseDto,
    description: 'Dashboard özet metrikleri başarıyla döndürüldü.',
  })
  getSummary(): Promise<AdminDashboardSummaryResponseDto> {
    return this.adminDashboardService.getSummary();
  }
}
