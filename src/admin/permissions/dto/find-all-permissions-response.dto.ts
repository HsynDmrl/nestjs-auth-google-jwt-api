import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FindAllPermissionsResponseDto {
  @ApiProperty({ description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Yetki adı', example: 'admin_create_user' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Bu yetkiye bağlı roller', example: ['Admin', 'Moderator'] })
  @Expose()
  roles?: string[]; 
}
