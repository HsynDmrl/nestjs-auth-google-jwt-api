import { Expose } from "class-transformer";

export class BaseStatusResponseDto {
    @Expose()
    message: string;
    @Expose()
    roleName: string;
}