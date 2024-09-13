import { ApiProperty } from "@nestjs/swagger";
import { BaseAdminUserRequestDto } from "../abstracts/base-admin-users-request.dto";

export class CreateAdminUserRequestDto extends BaseAdminUserRequestDto {

    // email onayı yapılmış mı?
    @ApiProperty({ description: 'Email onayı yapıldı mı?' })
    emailConfirmed: boolean;
}