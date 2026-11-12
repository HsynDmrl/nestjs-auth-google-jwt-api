import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, Length } from 'class-validator';

export class CreateBranchDto {
  @IsUUID('4')
  @IsNotEmpty()
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  companyId: string;

  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  @ApiProperty({ example: 'Kadıköy Şubesi' })
  name: string;
}
