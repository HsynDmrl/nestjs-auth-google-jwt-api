import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { Role } from 'src/entities/role.entity';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({ description: 'Kullanıcının adı', example: 'Ali', type: 'string' })
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({ description: 'Kullanıcının soyadı', example: 'Veli', type: 'string' })
  readonly surname: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({ description: 'Kullanıcının e-posta adresi', example: 'ali@gmail.com', type: 'string' })
  readonly email: string;

  @IsBoolean()
  readonly emailConfirmed: boolean;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Kullanıcının şifresi', example: '123456', type: 'string' })
  /*@Matches(/(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/, {
    message: 'Password too weak. It should be at least 8 characters long and contain letters and numbers.',
  })*/
  readonly password: string;
  
  readonly roles?: Role[];
}