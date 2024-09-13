import { PartialType } from '@nestjs/mapped-types';
import { BaseAdminUserRequestDto } from "../abstracts/base-admin-users-request.dto";
import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@ApiExtraModels(BaseAdminUserRequestDto)
export class UpdateAdminUserRequestDto extends PartialType(BaseAdminUserRequestDto) {

    // emailConfirmed alanı
    @ApiProperty({
        description: 'Kullanıcının e-postasının onay durumu. False yaparak kullanıcıyı engelleyebilirsiniz.',
        example: true // Örnek değer
    })
    emailConfirmed: boolean;

    // Rolleri eklemek için opsiyonel bir alan
    @ApiPropertyOptional({
        description: `Kullanıcının sahip olacağı rollerin id listesi. 
                      - Rolleri tamamen silmek için bu alanı boş gönderin. 
                      - Rolleri değiştirmek için appendRoles false olmalıdır. 
                      - Mevcut rollere yeni roller eklemek için appendRoles true olmalıdır.
                      
                      Mevcut rolleri koruyarak yeni rolleri eklemek için true yapın. 

                      False yapıldığında ya da hiç gönderilmediğinde mevcut roller silinir ve roleIds'de belirtilen roller atanır.
                      
                      **Örnekler:**
                      - Rolleri tamamen değiştirme: 
                      {
                        "emailConfirmed": true,
                        "appendRoles": false,
                        "roleIds": ["role-id-1", "role-id-2"]
                      }
                      - Mevcut rollere yeni roller ekleme: 
                      {
                        "emailConfirmed": true,
                        "appendRoles": true,
                        "roleIds": ["role-id-3", "role-id-4"]
                      }
                      - Rolleri tamamen silme: 
                      {
                        "emailConfirmed": true,
                        "appendRoles": false,
                        "roleIds": []
                      }`,
        example: true
    })
    appendRoles?: boolean;
    
}
