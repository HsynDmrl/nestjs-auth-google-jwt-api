import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('subscriptions')
  @ApiOperation({ summary: 'Company için aktif abonelik/paket tanımlar.' })
  upsertSubscription(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    upsertSubscriptionDto: UpsertSubscriptionDto,
  ) {
    return this.billingService.upsertSubscription(upsertSubscriptionDto);
  }

  @Get('companies/:companyId/features')
  @ApiOperation({ summary: 'Şirketin efektif plan özelliklerini döner.' })
  async getCompanyPlanFeatures(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ) {
    const plan = await this.billingService.getEffectivePlan(companyId);
    const features = await this.billingService.getFeatureSet(companyId);
    return { companyId, plan, features };
  }
}
