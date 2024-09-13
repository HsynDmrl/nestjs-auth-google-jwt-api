import { NotFoundException } from "@nestjs/common";
import { GetByIdAdminUsersResponseDto } from "./responses/concretes/operations/getById-admin-users-resoonse.dto";
import { FindByIdsRolesResponseDto } from "../roles/responses/concretes/operations/findByIds-roles-response.dto";

export class AdminUsersBusinessLogic {
  
    validateUserExists(user: GetByIdAdminUsersResponseDto | undefined, id: string): void {
        if (!user) {
            throw new NotFoundException(`Kullanıcı ID'si ${id} olan kullanıcı bulunamadı.`);
        }
    }

    validateRolesExist(roles: FindByIdsRolesResponseDto[]): void {
        if (roles.length === 0) {
            throw new NotFoundException('Geçerli roller bulunamadı');
        }
    }

    validateUsersExist(users: GetByIdAdminUsersResponseDto[]): void {
        if (users.length === 0) {
            throw new NotFoundException('Kullanıcı bulunamadı');
        }
    }

    validateInactiveUsersExist(users: GetByIdAdminUsersResponseDto[]): void {
        if (users.length === 0) {
            throw new NotFoundException('Pasif kullanıcı bulunamadı');
        }
    }

    validateUserNamesUniqueness(existingUser: GetByIdAdminUsersResponseDto | undefined): void {
        if (existingUser) {
            throw new NotFoundException('Bu isimde bir kullanıcı zaten mevcut.');
        }
    }

    generateSoftDeleteMessage(userName: string): string {
        return `Kullanıcı ${userName} soft delete ile pasif yapıldı.`;
    }

    generateRestoreMessage(userName: string): string {
        return `Kullanıcı ${userName} geri yüklendi.`;
    }

    generateHardDeleteMessage(userName: string): string {
        return `Kullanıcı '${userName}' kalıcı olarak silindi.`;
    }

    validateNotSoftDeleted(user: GetByIdAdminUsersResponseDto): void {
        if (user.deletedAt) {
            throw new NotFoundException(`Kullanıcı '${user.name}' zaten soft delete yapılmış.`);
        }
    }

    validateSoftDeleted(user: GetByIdAdminUsersResponseDto): void {
        if (!user.deletedAt) {
            throw new NotFoundException(`Kullanıcı '${user.name}' zaten soft delete yapılmamış.`);
        }
    }

}

