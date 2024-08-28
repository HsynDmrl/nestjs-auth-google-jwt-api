import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
  ) {}

  // Yeni fonksiyon: Role yetki atama
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionsRepository.findByIds(permissionIds);

    role.permissions = permissions;
    return this.rolesRepository.save(role);
  }

  async findAll(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });
    if (roles.length === 0) {
      throw new NotFoundException('Rol bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }
  
  async findAllInactive(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      where: {
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      relations: ['permissions'], 
      skip: (page - 1) * limit,
      take: limit,
    });
    if (roles.length === 0) {
      throw new NotFoundException('Pasif rol bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }
  
  async findAllIncludingDeleted(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      withDeleted: true,
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });
    if (roles.length === 0) {
      throw new NotFoundException('Rol bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }
  
  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['permissions'],  
    });
    if (!role) {
      throw new NotFoundException(`Rol ID'si ${id} olan rol bulunamadı`);
    }
    return role;
  }
  

  // Yeni bir rol oluşturur
  async create(role: Role): Promise<Role> {
    const existingRole = await this.rolesRepository.findOne({ where: { name: role.name }, withDeleted: true });
    if (existingRole) {
      throw new BadRequestException('Bu isimde bir rol zaten mevcut.');
    }

    return this.rolesRepository.save(role);
  }

  // Belirli bir rolü günceller
  async update(id: string, role: Role): Promise<Role> {
    const existingRole = await this.findOne(id); // findOne metodu zaten rolü bulamazsa exception atar

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
