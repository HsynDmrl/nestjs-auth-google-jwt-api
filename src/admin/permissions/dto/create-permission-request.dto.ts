import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsArray } from 'class-validator';

export class CreatePermissionRequestDto {
  @ApiProperty({ description: 'Yetkinin adı', example: 'admin_create_user' })
  @IsString()
  @Expose()
  name: string;

  @ApiProperty({ description: 'Yetki ile ilişkilendirilecek rollerin ID\'leri', example: ['roleId1', 'roleId2'], required: false })
  @IsArray()
  @Expose()
  roles?: string[];
}
