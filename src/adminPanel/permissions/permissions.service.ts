import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Permission } from 'src/entities/permission.entity';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  // Tüm yetkileri getirir (Soft delete yapılmamış olanlar)
  async findAll(page: number, limit: number): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    const [permissions, total] = await this.permissionsRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    if (permissions.length === 0) {
      throw new NotFoundException('Yetki bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { permissions, total, totalPages };
  }

  // Tüm yetkileri getirir (Soft delete yapılmış olanlar dahil)
  async findAllIncludingDeleted(page: number, limit: number): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    const [permissions, total] = await this.permissionsRepository.findAndCount({
      withDeleted: true,
      skip: (page - 1) * limit,
      take: limit,
    });
    if (permissions.length === 0) {
      throw new NotFoundException('Yetki bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { permissions, total, totalPages };
  }

  // Soft delete yapılmış yetkileri getirir (deletedAt sütunu dolu olanlar)
  async findAllInactive(page: number, limit: number): Promise<{ permissions: Permission[], total: number, totalPages: number }> {
    const [permissions, total] = await this.permissionsRepository.findAndCount({
      where: {
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      skip: (page - 1) * limit,
      take: limit,
    });
    if (permissions.length === 0) {
      throw new NotFoundException('Pasif yetki bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { permissions, total, totalPages };
  }

  // Belirli bir yetkiyi getirir, soft delete yapılmış yetkiler de dahil
  async findOne(id: string): Promise<Permission> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!permission) {
      throw new NotFoundException(`Yetki ID'si ${id} olan yetki bulunamadı`);
    }
    return permission;
  }

  // Yeni bir yetki oluşturur
  async create(permission: Permission): Promise<Permission> {
    const existingPermission = await this.permissionsRepository.findOne({ where: { name: permission.name }, withDeleted: true });
    if (existingPermission) {
      throw new BadRequestException('Bu isimde bir yetki zaten mevcut.');
    }

    const createdPermission = await this.permissionsRepository.save(permission);

    return createdPermission;
  }

  // Belirli bir yetkiyi günceller
  async update(id: string, permission: Permission): Promise<Permission> {
    const existingPermission = await this.findOne(id);

    Object.assign(existingPermission, permission);
    const updatedPermission = await this.permissionsRepository.save(existingPermission);

    return updatedPermission;
  }

  // Soft delete işlemi (Yetkiyi pasif yapar)
  async softRemove(id: string): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.softDelete(id);
    return { message: `Yetki ${permission.name} soft delete ile pasif yapıldı.` };
  }

  // Soft delete yapılmış yetkiyi geri yükler
  async restore(id: string): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.restore(id);
    return { message: `Yetki ${permission.name} geri yüklendi.` };
  }

  // Kalıcı olarak siler (Hard delete)
  async remove(id: string): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.delete(id);
    return { message: `Yetki ${permission.name} kalıcı olarak silindi.` };
  }
}
