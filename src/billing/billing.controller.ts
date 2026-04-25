import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { BillingService } from './billing.service';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';

@ApiBearerAuth('access-token')
@ApiTags('Billing')
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscriptions')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Company için aktif abonelik/paket tanımlar.' })
  upsertSubscription(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    upsertSubscriptionDto: UpsertSubscriptionDto,
  ) {
    return this.billingService.upsertSubscription(upsertSubscriptionDto);
  }

  @Get('companies/:companyId/features')
  @Permissions('admin_read_users')
  @ApiOperation({ summary: 'Şirketin efektif plan özelliklerini döner.' })
  async getCompanyPlanFeatures(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ) {
    return this.billingService.getCompanyCapabilitySnapshot(companyId);
  }
}
