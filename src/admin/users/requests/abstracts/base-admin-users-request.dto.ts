import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, IsArray, ArrayNotEmpty, MaxLength } from "class-validator";

export class BaseAdminUserRequestDto {
  @ApiProperty({ description: 'Kullanıcının adı', example: 'Ali', type: 'string' })
  @IsString()
  @MaxLength(100, { message: 'Ad en fazla 100 karakter olabilir' })
  name: string;

  @ApiProperty({ description: 'Kullanıcının soyadı', example: 'Veli', type: 'string' })
  @IsString()
  @MaxLength(100, { message: 'Soyad en fazla 100 karakter olabilir' })
  surname: string;

  @ApiProperty({ description: 'Kullanıcının e-posta adresi', example: 'ali@gmail.com', type: 'string' })
  @IsString()
  @MaxLength(100, { message: 'E-posta en fazla 100 karakter olabilir' })
  email: string;

  @ApiProperty({ description: 'Kullanıcının şifresi', example: '123456', type: 'string' })
  @IsString()
  @MaxLength(30, { message: 'Şifre en fazla 30 karakter olabilir' })
  password: string;

  @ApiProperty({
    description: 'Rolün sahip olacağı yetkilerin id listesi',
    example: ['396aa3f9-aaa1-4b26-9869-48a45e90ec81', '13816204-3860-4e28-90d5-5f8f16ba3da6'],
    type: 'string',
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Rol id listesi boş olamaz' })
  @IsUUID('4', { each: true, message: 'Her rol id geçerli bir UUID olmalıdır' })
  roleIds: string[];
}
