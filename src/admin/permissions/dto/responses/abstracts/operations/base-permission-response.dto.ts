import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";

export class BasePermissionResponseDto  {

    @ApiProperty({ description: 'Yetki ID\'si', example: 'd290f1ee-6c54-4b01-90e6-d701748f0851' })  
    @Expose()
    id: string;

    @Expose()
    @ApiProperty({ description: 'Yetkinin adı', example: 'admin_update_user' })
    name: string;

    @Expose()
    @ApiProperty({ description: 'Oluşturulma tarihi', example: '01-09-2021 00:00:00' })
    createdAt: Date;

    @Expose()
    @ApiProperty({ description: 'Güncellenme tarihi', example: '01-09-2021 00:00:00' })
    updatedAt: Date;

    @Expose()
    @ApiProperty({ description: 'Silinme tarihi', example: '01-09-2021 00:00:00' })
    deletedAt?: Date;
}
