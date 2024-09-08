import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Permission } from 'src/entities/permission.entity';
import { GetByIdPermissionsResponseDto } from './dto/responses/concretes/operations/getById-permissions-resoonse.dto';

@Injectable()
export class PermissionsBusinessLogic {

  validateAllPermissionsExist(requestedIds: string[], foundPermissions: Permission[]): void {
    const foundPermissionIds = foundPermissions.map(permission => permission.id);
    const missingPermissionIds = requestedIds.filter(id => !foundPermissionIds.includes(id));

    if (missingPermissionIds.length > 0) {
      throw new NotFoundException(`Belirtilen ID'lere sahip yetkiler bulunamadı: ${missingPermissionIds.join(', ')}`);
    }

    // Tekrar eden ID'leri kontrol et
    const duplicateIds = requestedIds.filter((id, index) => requestedIds.indexOf(id) !== index);
    if (duplicateIds.length > 0) {
      throw new BadRequestException(`Tekrar eden ID'ler bulundu: ${duplicateIds.join(', ')}`);
    }
  }

  validatePermissionsExist(permissions: Permission[], ids?: string[]): void {
    if (permissions.length === 0) {
      if (ids) {
        throw new NotFoundException(`Belirtilen ID'lere sahip yetkiler bulunamadı: ${ids.join(', ')}`);
      }
      throw new NotFoundException('Yetki bulunamadı');
    }
  }

  validatePermissionExists(permission: Permission | undefined, id: string): void {
    if (!permission) {
      throw new NotFoundException(`Yetki ID'si ${id} olan yetki bulunamadı`);
    }
  }

  validatePermissionNameUniqueness(existingPermission: Permission | undefined): void {
    if (existingPermission) {
      throw new BadRequestException('Bu isimde bir yetki zaten mevcut.');
    }
  }
  // Eğer zaten soft delete yapılmışsa hata fırlat
  validateNotSoftDeleted(permission: GetByIdPermissionsResponseDto): void {
    if (permission.deletedAt) {
      throw new BadRequestException(`Yetki '${permission.name}' zaten soft delete yapılmış.`);
    }
  }

  // Eğer soft delete yapılmamışsa hata fırlat
  validateSoftDeleted(permission: GetByIdPermissionsResponseDto): void {
    if (!permission.deletedAt) {
      throw new BadRequestException(`Yetki '${permission.name}' soft delete yapılmadığı için geri yüklenemez.`);
    }
  }

  calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  generateSoftDeleteMessage(permissionName: string): string {
    return `Yetki '${permissionName}' soft delete ile pasif yapıldı.`;
  }

  generateRestoreMessage(permissionName: string): string {
    return `Yetki '${permissionName}' geri yüklendi.`;
  }

  generateHardDeleteMessage(permissionName: string): string {
    return `Yetki '${permissionName}' kalıcı olarak silindi.`;
  }

}
