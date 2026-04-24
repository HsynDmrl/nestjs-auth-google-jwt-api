import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateWeeklyScheduleDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  branchId: string;

  @IsDateString()
  @ApiProperty({ example: '2026-05-18' })
  weekStartDate: string;

  @IsDateString()
  @ApiProperty({ example: '2026-05-24' })
  weekEndDate: string;
}
