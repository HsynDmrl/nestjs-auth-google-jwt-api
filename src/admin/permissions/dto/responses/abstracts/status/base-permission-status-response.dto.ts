import { Expose } from "class-transformer";

export class BasePermissionStatusResponseDto {
    @Expose()
    message: string;
    @Expose()
    permissionName: string;
}