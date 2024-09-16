import { ApiProperty } from "@nestjs/swagger";
import { BasePermissionResponseDto } from "../../abstracts/operations/base-permission-response.dto";
import { Expose } from "class-transformer";
import { Role } from "src/entities/role.entity";

export class GetByIdPermissionsResponseDto extends BasePermissionResponseDto {
    @ApiProperty({ description: 'Yetkinin bağlı olduğu roller', example: ['Admin', 'User'] })
    @Expose()
    roles: Role[];
 }   