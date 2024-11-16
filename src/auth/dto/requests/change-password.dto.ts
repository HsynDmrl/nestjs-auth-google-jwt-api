import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'mevcutSifre', description: 'Kullanıcının mevcut şifresi.' })
  readonly currentPassword: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'yeniSifre123', description: 'Kullanıcının yeni şifresi.' })
  /*@Matches(/(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/, {
    message: 'New password too weak. It should be at least 8 characters long and contain letters and numbers.',
  })*/
  readonly newPassword: string;
}
