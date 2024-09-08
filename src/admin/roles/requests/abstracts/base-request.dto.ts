import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsUUID, IsArray, ArrayNotEmpty } from "class-validator";

export class BaseRequestDto {
  @ApiProperty({ description: 'Rol adı', example: 'Admin' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Yetkinin sahip olduğu ID’ler',
    example: ['396aa3f9-aaa1-4b26-9869-48a45e90ec81', '13816204-3860-4e28-90d5-5f8f16ba3da6'],
    type: 'string',
    isArray: true
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  permissionsIds: string[];
}
