import { User } from "src/entities/user.entity";

export class GoogleLoginResponseDto {
  readonly message: string;
  readonly user: User;
  readonly accessToken: string;
}
