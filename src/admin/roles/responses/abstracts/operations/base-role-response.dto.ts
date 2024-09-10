import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import { BasePermissionResponseDto } from "../../../../permissions/dto/responses/abstracts/operations/base-permission-response.dto";

export class BaseRoleResponseDto {

    @ApiProperty({ description: 'Rol ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })  
    @Expose()
    id: string;

    @Expose()
    @ApiProperty({ description: 'Rol adı', example: 'admin_update_user' })
    name: string;

    @ApiProperty({ description: 'Oluşturulma tarihi', example: '01-09-2021 00:00:00' })
    @Expose()
    createdAt: Date;

    @ApiProperty({ description: 'Güncellenme tarihi', example: '01-09-2021 00:00:00' })
    @Expose()
    updatedAt: Date;

    @ApiProperty({ description: 'Silinme tarihi', example: '01-09-2021 00:00:00' })
    @Expose()
    deletedAt?: Date;
    
    @Expose()
    @Type(() => BasePermissionResponseDto)
    @ApiProperty({
        description: 'Yetkiler',
        type: BasePermissionResponseDto,
        isArray: true,
    })
    permissions: BasePermissionResponseDto[];
}
