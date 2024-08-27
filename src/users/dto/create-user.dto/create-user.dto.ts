import { IsEmail, IsString, IsBoolean } from 'class-validator';
import { Role } from 'src/entities/role.entity';

export class CreateUserDto {
  @IsString()
  readonly name: string;

  @IsString()
  readonly surname: string;

  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password?: string;

  @IsBoolean()
  readonly emailConfirmed: boolean;

  readonly roles?: Role[];
}
