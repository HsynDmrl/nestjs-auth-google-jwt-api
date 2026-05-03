import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from 'src/auth/decorators/permissions/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/guards/permissions/permissions.guard';
import { CompanySubscriptionStatusDto } from './dto/company-subscription-status.dto';
import { RestoreStoreSubscriptionDto } from './dto/restore-store-subscription.dto';
import { VerifyStorePurchaseDto } from './dto/verify-store-purchase.dto';
import { StoreBillingService } from './store-billing.service';

@ApiBearerAuth('access-token')
@ApiTags('Billing')
@Controller('billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class StoreBillingController {
  constructor(private readonly storeBillingService: StoreBillingService) {}

  @Post('store/verify')
  @Permissions('billing_verify_purchase')
  @ApiOperation({ summary: 'Mağaza satın alımını doğrular.' })
  @ApiResponse({ status: 201, type: CompanySubscriptionStatusDto })
  verifyPurchase(
    @Req() request,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: VerifyStorePurchaseDto,
  ): Promise<CompanySubscriptionStatusDto> {
    return this.storeBillingService.verifyPurchase(dto, request.user?.id ?? '');
  }

  @Post('store/restore')
  @Permissions('billing_restore_subscription')
  @ApiOperation({ summary: 'Mağaza aboneliğini restore eder.' })
  @ApiResponse({ status: 201, type: CompanySubscriptionStatusDto })
  restoreSubscription(
    @Req() request,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: RestoreStoreSubscriptionDto,
  ): Promise<CompanySubscriptionStatusDto> {
    return this.storeBillingService.restoreSubscription(
      dto,
      request.user?.id ?? '',
    );
  }

  @Get('companies/:companyId/subscription-status')
  @Permissions('billing_read_subscription_status')
  @ApiOperation({ summary: 'Şirket abonelik durumunu döner.' })
  @ApiResponse({ status: 200, type: CompanySubscriptionStatusDto })
  getCompanySubscriptionStatus(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ): Promise<CompanySubscriptionStatusDto> {
    return this.storeBillingService.getCompanySubscriptionStatus(companyId);
  }
}
