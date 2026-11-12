import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length, Matches } from 'class-validator';

export class CreateShiftTemplateDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  branchId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 120)
  @ApiProperty({ example: 'Sabah Vardiyası' })
  name: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  @ApiProperty({ example: '09:00' })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  @ApiProperty({ example: '17:00' })
  endTime: string;
}
