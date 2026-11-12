import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
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
import { AdminBillingService } from './admin-billing.service';
import { BillingService } from './billing.service';
import { AdminPurchaseQueryDto } from './dto/admin-purchase-query.dto';
import { AdminPurchaseResponseDto } from './dto/admin-purchase-response.dto';
import { AdminStoreProductDto } from './dto/admin-store-product.dto';
import { AdminSubscriptionDetailDto } from './dto/admin-subscription-detail.dto';
import { AdminSubscriptionQueryDto } from './dto/admin-subscription-query.dto';
import { AdminSubscriptionResponseDto } from './dto/admin-subscription-response.dto';
import { AdminSubscriptionUpdateDto } from './dto/admin-subscription-update.dto';
import { CompanySubscriptionStatusDto } from './dto/company-subscription-status.dto';
import { UpsertSubscriptionDto } from './dto/upsert-subscription.dto';

@ApiBearerAuth('access-token')
@ApiTags('Billing')
@Controller('admin/billing')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
    private readonly adminBillingService: AdminBillingService,
  ) {}

  @Post('subscriptions')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Company için aktif abonelik/paket tanımlar.' })
  upsertSubscription(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    upsertSubscriptionDto: UpsertSubscriptionDto,
  ) {
    return this.billingService.upsertSubscription(upsertSubscriptionDto);
  }

  @Get('companies/:companyId/features')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Şirketin efektif plan özelliklerini döner.' })
  async getCompanyPlanFeatures(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ) {
    return this.billingService.getCompanyCapabilitySnapshot(companyId);
  }

  @Get('subscriptions')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Tüm abonelikleri listeler.' })
  @ApiResponse({ status: 200, type: AdminSubscriptionResponseDto })
  listSubscriptions(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AdminSubscriptionQueryDto,
  ) {
    return this.adminBillingService.listSubscriptions(query);
  }

  @Get('subscriptions/:subscriptionId')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Abonelik detayını getirir.' })
  @ApiResponse({ status: 200, type: AdminSubscriptionDetailDto })
  getSubscription(
    @Param('subscriptionId', new ParseUUIDPipe({ version: '4' }))
    subscriptionId: string,
  ) {
    return this.adminBillingService.getSubscription(subscriptionId);
  }

  @Put('subscriptions/:subscriptionId')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Abonelik kaydını günceller.' })
  @ApiResponse({ status: 200, type: AdminSubscriptionDetailDto })
  updateSubscription(
    @Req() request,
    @Param('subscriptionId', new ParseUUIDPipe({ version: '4' }))
    subscriptionId: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    updateDto: AdminSubscriptionUpdateDto,
  ) {
    return this.adminBillingService.updateSubscription(
      subscriptionId,
      updateDto,
      {
        id: request.user?.id ?? 'system',
        email: request.user?.email,
      },
    );
  }

  @Get('purchases')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Tüm satın alım kayıtlarını listeler.' })
  @ApiResponse({ status: 200, type: AdminPurchaseResponseDto })
  listPurchases(
    @Query(new ValidationPipe({ transform: true, whitelist: true }))
    query: AdminPurchaseQueryDto,
  ) {
    return this.adminBillingService.listPurchases(query);
  }

  @Get('purchases/:purchaseId')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Satın alım kaydını getirir.' })
  @ApiResponse({ status: 200, type: AdminPurchaseResponseDto })
  getPurchase(
    @Param('purchaseId', new ParseUUIDPipe({ version: '4' }))
    purchaseId: string,
  ) {
    return this.adminBillingService.getPurchase(purchaseId);
  }

  @Get('companies/:companyId/subscription-status')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Şirket abonelik durumunu döner.' })
  @ApiResponse({ status: 200, type: CompanySubscriptionStatusDto })
  getCompanySubscriptionStatus(
    @Param('companyId', new ParseUUIDPipe({ version: '4' })) companyId: string,
  ) {
    return this.billingService.getCompanySubscriptionStatus(companyId);
  }

  @Get('store-products')
  @Permissions('admin_manage_billing')
  @ApiOperation({ summary: 'Mağaza ürün ID eşlemesini döner.' })
  @ApiResponse({ status: 200, type: AdminStoreProductDto })
  listStoreProducts() {
    return this.adminBillingService.listStoreProducts();
  }
}
