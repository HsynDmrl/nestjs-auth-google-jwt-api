import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'resetToken', description: 'Şifre sıfırlama tokeni.' })
  readonly newPassword: string;
}
