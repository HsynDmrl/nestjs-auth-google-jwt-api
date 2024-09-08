import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Permission } from "src/entities/permission.entity";
import { Role } from "src/entities/role.entity";
import { FindByIdsRolesResponseDto } from "./responses/concretes/operations/findByIds-roles-response.dto";
import { GetByIdRolesResponseDto } from "./responses/concretes/operations/getById-roles-resoonse.dto";

@Injectable()
export class AdminRolesBusinessLogic {

  validateRoleExists(role: Role | undefined, id: string): void {
    if (!role) {
      throw new NotFoundException(`Rol ID'si ${id} olan rol bulunamadı.`);
    }
  }

  validatePermissionsExist(permissions: Permission[]): void {
    if (permissions.length === 0) {
      throw new BadRequestException('Geçerli yetkiler bulunamadı');
    }
  }

  validateRolesExist(roles: Role[]): void {
    if (roles.length === 0) {
      throw new NotFoundException('Rol bulunamadı');
    }
  }

  validateInactiveRolesExist(roles: Role[]): void {
    if (roles.length === 0) {
      throw new NotFoundException('Pasif rol bulunamadı');
    }
  }

  validateRoleNameUniqueness(existingRole: Role | undefined): void {
    if (existingRole) {
      throw new BadRequestException('Bu isimde bir rol zaten mevcut.');
    }
  }

  generateSoftDeleteMessage(roleName: string): string {
    return `Rol ${roleName} soft delete ile pasif yapıldı.`;
  }

  generateRestoreMessage(roleName: string): string {
    return `Rol ${roleName} geri yüklendi.`;
  }

  generateHardDeleteMessage(roleName: string): string {
    return `Rol '${roleName}' kalıcı olarak silindi.`;
  }

  // Eğer zaten soft delete yapılmışsa hata fırlat
  validateNotSoftDeleted(role: GetByIdRolesResponseDto): void {
    if (role.deletedAt) {
      throw new BadRequestException(`Rol '${role.name}' zaten soft delete yapılmış.`);
    }
  }

  // Eğer soft delete yapılmamışsa restore edilemez
  validateSoftDeleted(role: GetByIdRolesResponseDto): void {
    if (!role.deletedAt) {
      throw new BadRequestException(`Rol '${role.name}' soft delete yapılmadığı için geri yüklenemez.`);
    }
  }
}
