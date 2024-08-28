import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Role } from 'src/entities/role.entity';

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  // Tüm aktif rolleri getirir (soft delete yapılmamış olanlar)
  async findAll(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    if (roles.length === 0) {
      throw new NotFoundException('Rol bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }

  // Tüm pasif rolleri getirir (soft delete yapılmış olanlar)
  async findAllInactive(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      where: {
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      skip: (page - 1) * limit,
      take: limit,
    });
    if (roles.length === 0) {
      throw new NotFoundException('Pasif rol bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }

  // Silinmiş roller de dahil olmak üzere tüm rolleri getirir
  async findAllIncludingDeleted(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      withDeleted: true,
      skip: (page - 1) * limit,
      take: limit,
    });
    if (roles.length === 0) {
      throw new NotFoundException('Rol bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }

  // Belirli bir rolü getirir, soft delete yapılmış roller de dahil
  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!role) {
      throw new NotFoundException(`Rol ID'si ${id} olan rol bulunamadı`);
    }
    return role;
  }

  // Yeni bir rol oluşturur
  async create(role: Role): Promise<Role> {
    // Business Logic: Check if a role with the same name already exists
    const existingRole = await this.rolesRepository.findOne({ where: { name: role.name }, withDeleted: true });
    if (existingRole) {
      throw new BadRequestException('Bu isimde bir rol zaten mevcut.');
    }

    return this.rolesRepository.save(role);
  }

  // Belirli bir rolü günceller
  async update(id: string, role: Role): Promise<Role> {
    const existingRole = await this.findOne(id); // findOne metodu zaten rolü bulamazsa exception atar

    // Business Logic: Check if another role with the same name exists
    const roleWithSameName = await this.rolesRepository.findOne({ where: { name: role.name, id: Not(id) }, withDeleted: true });
    if (roleWithSameName) {
      throw new BadRequestException('Bu isimde başka bir rol zaten mevcut.');
    }

    Object.assign(existingRole, role);
    return this.rolesRepository.save(existingRole);
  }

  // Soft delete işlemi (Rolü pasif yapar)
  async softRemove(id: string): Promise<{ message: string }> {
    const role = await this.findOne(id); // Rol yoksa exception atar
    await this.rolesRepository.softDelete(id);
    return { message: `Rol ${role.name} soft delete ile pasif yapıldı.` };
  }

  // Soft delete yapılmış rolü geri yükler
  async restore(id: string): Promise<{ message: string }> {
    const role = await this.findOne(id); // Rol yoksa exception atar
    await this.rolesRepository.restore(id);
    return { message: `Rol ${role.name} geri yüklendi.` };
  }

  // Kalıcı olarak siler (Hard delete)
  async remove(id: string): Promise<{ message: string }> {
    const role = await this.findOne(id); // Rol yoksa exception atar
    await this.rolesRepository.delete(id);
    return { message: `Rol ${role.name} kalıcı olarak silindi.` };
  }
}
