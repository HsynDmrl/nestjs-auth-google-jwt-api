import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmEmailDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'token', description: 'E-posta doğrulama tokeni.' })
  readonly token: string;
}
