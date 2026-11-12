import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 150)
  @ApiProperty({ example: 'Cafe de Luna Holding' })
  name: string;
}
