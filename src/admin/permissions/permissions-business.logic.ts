import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Permission } from 'src/entities/permission.entity';

@Injectable()
export class PermissionsBusinessLogic {

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

  calculateTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }

  generateMessage(action: string, permissionName: string): { message: string } {
    return { message: `Yetki ${permissionName} ${action}.` };
  }
}
