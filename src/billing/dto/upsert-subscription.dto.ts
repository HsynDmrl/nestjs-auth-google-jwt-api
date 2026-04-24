import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PlanCode, SubscriptionStatus } from 'src/entities/subscription.entity';

export class UpsertSubscriptionDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId: string;

  @IsEnum(PlanCode)
  @ApiProperty({ enum: PlanCode, example: PlanCode.STARTER })
  planCode: PlanCode;

  @IsOptional()
  @IsEnum(SubscriptionStatus)
  @ApiProperty({ enum: SubscriptionStatus, required: false })
  status?: SubscriptionStatus;

  @IsDateString()
  @ApiProperty({ example: '2026-04-01T00:00:00.000Z' })
  periodStartAt: string;

  @IsDateString()
  @ApiProperty({ example: '2026-04-30T23:59:59.000Z' })
  periodEndAt: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'stripe' })
  provider?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, example: 'sub_123' })
  providerSubscriptionId?: string;
}
