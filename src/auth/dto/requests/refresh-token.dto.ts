import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'refreshToken', description: 'Refresh token.' })
  readonly refreshToken: string;

  @IsUUID()
  @IsNotEmpty()
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', description: 'Kullanıcı ID.' })
  readonly userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'accessToken', description: 'Access token.' })
  readonly accessToken: string;
}
