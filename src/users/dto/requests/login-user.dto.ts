import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginUserDto {
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'Kullanıcının e-posta adresi', example: 'admin@admin.com', type: 'string' })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Kullanıcının şifresi', example: 'admin', type: 'string' })
  readonly password: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ description: 'Captcha', example: '123456', type: 'string' })
  readonly captchaInput?: string;
}
