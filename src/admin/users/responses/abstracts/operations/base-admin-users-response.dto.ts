import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { BaseRoleResponseDto } from "src/admin/roles/responses/abstracts/operations/base-role-response.dto";

export class BaseAdminUserResponseDto {

    @ApiProperty({ description: 'Kullanıcı id', example: '396aa3f9-aaa1-4b26-9869-48a45e90ec81' })  
    @Expose()
    id: string;

    @Expose()
    @ApiProperty({ description: 'Kullanıcı adı', example: 'Ali' })
    name: string;

    @Expose()
    @ApiProperty({ description: 'Kullanıcı soyadı', example: 'Veli' })
    surname: string;

    @Expose()
    @ApiProperty({ description: 'Kullanıcı e-posta adresi', example: 'ali@gmail.com' })
    email: string;

    @Expose()
    @ApiProperty({ description: 'Kullanıcı şifresi', example: '123456' })
    password: string;

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
    @Type(() => BaseRoleResponseDto)
    @ApiProperty({
        description: 'Kullanıcının sahip olduğu roller',
        type: BaseRoleResponseDto,
        isArray: true,
    })
    roles: BaseRoleResponseDto[];
}
