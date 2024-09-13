import { Expose } from "class-transformer";

export class BaseAdminUserStatusResponseDto {
    @Expose()
    message: string;
    @Expose()
    userName: string;
}