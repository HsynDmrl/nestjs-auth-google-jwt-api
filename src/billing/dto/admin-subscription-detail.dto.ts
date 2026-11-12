import { ApiPropertyOptional } from '@nestjs/swagger';
import { AdminPurchaseResponseDto } from './admin-purchase-response.dto';
import { AdminSubscriptionResponseDto } from './admin-subscription-response.dto';

export class AdminSubscriptionDetailDto extends AdminSubscriptionResponseDto {
  @ApiPropertyOptional({ type: [AdminPurchaseResponseDto] })
  purchases?: AdminPurchaseResponseDto[];
}
