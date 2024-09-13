import { PartialType } from '@nestjs/mapped-types';
import { BaseRoleRequestDto } from "../abstracts/base-role-request.dto";
import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleRequestDto extends PartialType(BaseRoleRequestDto) {

    // Rol adı
    @ApiProperty({
        description: 'Güncellenecek rolün adı.',
        example: 'Admin'
    })
    name: string;

    // İzinleri eklemek veya değiştirmek için opsiyonel bir alan
    @ApiPropertyOptional({
        description: `Güncellenecek rol için izinlerin id listesi. 
                      - İzinleri tamamen silmek için bu alanı boş gönderin.
                      - İzinleri değiştirmek için appendPermissions false olmalıdır.
                      - Mevcut izinlere yeni izinler eklemek için appendPermissions true olmalıdır.
                      
                      **Örnekler:**
                      - İzinleri tamamen değiştirme: 
                      {
                        "name": "Admin",
                        "appendPermissions": false,
                        "permissionsIds": ["permission-id-1", "permission-id-2"]
                      }
                      - Mevcut izinlere yeni izinler ekleme: 
                      {
                        "name": "Admin",
                        "appendPermissions": true,
                        "permissionsIds": ["permission-id-3", "permission-id-4"]
                      }
                      - İzinleri tamamen silme: 
                      {
                        "name": "Admin",
                        "appendPermissions": false,
                        "permissionsIds": []
                      }`,
        example: true
    })
    appendPermissions?: boolean;
    
}
