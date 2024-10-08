import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Permission } from "src/entities/permission.entity";
import { Role } from "src/entities/role.entity";
import { FindByIdsRolesResponseDto } from "./responses/concretes/operations/findByIds-roles-response.dto";
import { GetByIdRolesResponseDto } from "./responses/concretes/operations/getById-roles-resoonse.dto";
import { FindByIdsPermissionsResponseDto } from "../permissions/dto/responses/concretes/operations/findByIds-permissions-response.dto";

@Injectable()
export class AdminRolesBusinessLogic {
  
  validateAllRolesExist(requestedIds: string[], foundRoles: Role[]): void {
    const foundRoleIds = foundRoles.map(role => role.id);
    const missingRoleIds = requestedIds.filter(id => !foundRoleIds.includes(id));

    if (missingRoleIds.length > 0) {
      throw new NotFoundException(`Belirtilen ID'lere sahip roller bulunamadı: ${missingRoleIds.join(', ')}`);
    }

    // Tekrar eden ID'leri kontrol et
    const duplicateIds = requestedIds.filter((id, index) => requestedIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      throw new BadRequestException(`Tekrar eden ID'ler bulundu: ${duplicateIds.join(', ')}`);
    }
  }

  validateRoleExists(role: GetByIdRolesResponseDto | undefined, id: string): void {
    if (!role) {
      throw new NotFoundException(`Rol ID'si ${id} olan rol bulunamadı.`);
    }
  }

  validatePermissionsExist(permissions: FindByIdsPermissionsResponseDto[]): void {
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
