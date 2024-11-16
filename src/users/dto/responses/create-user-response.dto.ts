export class CreateUserResponseDto {
    readonly id: string;
    readonly email: string;
    readonly name: string;
    readonly surname: string;
    readonly emailConfirmed: boolean;
  }