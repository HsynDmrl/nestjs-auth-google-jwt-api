import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { IsString } from "class-validator";

export class BaseRequestDto {
    @ApiProperty({ description: 'Yetkinin adı', example: 'admin_update_user' })
    @IsString()
    @Expose()
    name: string;
}