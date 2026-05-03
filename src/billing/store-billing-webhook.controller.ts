import {
  Body,
  Controller,
  Headers,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SubscriptionPlatform } from 'src/entities/subscription.entity';
import { CompanySubscriptionStatusDto } from './dto/company-subscription-status.dto';
import { StoreWebhookDto } from './dto/store-webhook.dto';
import { StoreBillingService } from './store-billing.service';

@ApiTags('Billing')
@Controller('billing/webhooks')
export class StoreBillingWebhookController {
  constructor(private readonly storeBillingService: StoreBillingService) {}

  @Post('google-play')
  @ApiOperation({ summary: 'Google Play server notification webhook.' })
  @ApiResponse({ status: 200, type: CompanySubscriptionStatusDto })
  handleGooglePlayWebhook(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: StoreWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ): Promise<CompanySubscriptionStatusDto> {
    return this.storeBillingService.handleWebhook(
      SubscriptionPlatform.GOOGLE_PLAY,
      dto,
      signature,
      JSON.stringify(dto),
    );
  }

  @Post('app-store')
  @ApiOperation({ summary: 'App Store server notification webhook.' })
  @ApiResponse({ status: 200, type: CompanySubscriptionStatusDto })
  handleAppStoreWebhook(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    dto: StoreWebhookDto,
    @Headers('x-webhook-signature') signature?: string,
  ): Promise<CompanySubscriptionStatusDto> {
    return this.storeBillingService.handleWebhook(
      SubscriptionPlatform.APP_STORE,
      dto,
      signature,
      JSON.stringify(dto),
    );
  }
}
