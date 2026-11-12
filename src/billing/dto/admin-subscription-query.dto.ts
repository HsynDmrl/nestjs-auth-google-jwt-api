import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import {
  PlanCode,
  SubscriptionEnvironment,
  SubscriptionPlatform,
  SubscriptionStatus,
} from 'src/entities/subscription.entity';

export class AdminSubscriptionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  @ApiPropertyOptional({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId?: string;

  @IsOptional()
  @IsEnum(PlanCode)
  @ApiPropertyOptional({ enum: PlanCode })
  planCode?: PlanCode;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  @ApiPropertyOptional({ enum: SubscriptionStatus })
  status?: SubscriptionStatus;

  @IsOptional()
  @IsEnum(SubscriptionPlatform)
  @ApiPropertyOptional({ enum: SubscriptionPlatform })
  platform?: SubscriptionPlatform;

  @IsOptional()
  @IsEnum(SubscriptionEnvironment)
  @ApiPropertyOptional({ enum: SubscriptionEnvironment })
  environment?: SubscriptionEnvironment;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  @ApiPropertyOptional({ example: 'GPA.1234-5678-9012-34567' })
  transactionId?: string;
}
