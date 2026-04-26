import { ApiProperty } from '@nestjs/swagger';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({
    description: 'Kullanıcının adı',
    example: 'Ali',
    type: 'string',
  })
  readonly name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @ApiProperty({
    description: 'Kullanıcının soyadı',
    example: 'Veli',
    type: 'string',
  })
  readonly surname: string;

  @IsEmail()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Kullanıcının e-posta adresi',
    example: 'ali@gmail.com',
    type: 'string',
  })
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Kullanıcının şifresi',
    example: '123456',
    type: 'string',
  })
  /*@Matches(/(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}/, {
    message: 'Password too weak. It should be at least 8 characters long and contain letters and numbers.',
  })*/
  readonly password: string;

  @IsBoolean()
  @Equals(true, { message: 'KVKK açık rızası zorunludur.' })
  @ApiProperty({
    description: 'KVKK açık rıza onayı',
    example: true,
    type: 'boolean',
  })
  readonly kvkkConsentGiven: boolean;

  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  @ApiProperty({
    description: 'Onaylanan KVKK metin versiyonu',
    example: 'KVKK-v1.0',
    type: 'string',
  })
  readonly kvkkConsentVersion: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({
    description: 'Pazarlama iletişimi izni',
    example: false,
    required: false,
    type: 'boolean',
  })
  readonly marketingConsentGiven?: boolean;
}
