import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Permission } from "src/entities/permission.entity";
import { Role } from "src/entities/role.entity";

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

  generateHardDeleteMessage(permissionName: string): string {
    return `Yetki '${permissionName}' kalıcı olarak silindi.`;
  }

  validateNotSoftDeleted(entity: any): void {
    if (entity.deletedAt) {
      throw new BadRequestException(`${entity.name} zaten soft delete yapılmış.`);
    }
  }
  
}

