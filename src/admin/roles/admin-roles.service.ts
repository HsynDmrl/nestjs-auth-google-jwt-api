import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { PermissionsService } from '../permissions/permissions.service';
import { AdminRolesBusinessLogic } from './admin-roles-business.logic';

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private permissionsService: PermissionsService,
    private readonly roleBusinessLogic: AdminRolesBusinessLogic,
  ) { }

  async findByIds(ids: string[]): Promise<Role[]> {
    return this.rolesRepository.findBy({ id: In(ids) });
  }
  async findAllIncludingDeleted(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      withDeleted: true,
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Tüm rollerin varlığını business logic ile kontrol edin
    this.roleBusinessLogic.validateRolesExist(roles);

    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }
  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['permissions'],
    });

    // Rolü kontrol et
    this.roleBusinessLogic.validateRoleExists(role, id);
    return role;
  }

  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findOne(roleId);
    const permissions = await this.permissionsService.findByIds(permissionIds);

    // Geçerli yetkilerin olup olmadığını business logic'te kontrol et
    this.roleBusinessLogic.validatePermissionsExist(permissions);

    role.permissions = permissions;
    return this.rolesRepository.save(role);
  }

  async create(role: Role, permissionIds: string[]): Promise<Role> {
    const existingRole = await this.rolesRepository.findOne({ where: { name: role.name }, withDeleted: true });

    // Rol isminin benzersiz olup olmadığını business logic ile kontrol edin
    this.roleBusinessLogic.validateRoleNameUniqueness(existingRole);

    const createdRole = await this.rolesRepository.save(role);

    if (permissionIds.length > 0) {
      return this.assignPermissionsToRole(createdRole.id, permissionIds);
    }

    return createdRole;
  }

  async update(id: string, role: Role, permissionIds: string[]): Promise<Role> {
    const existingRole = await this.findOne(id);
    const roleWithSameName = await this.rolesRepository.findOne({ where: { name: role.name, id: Not(id) }, withDeleted: true });

    // Rol isminin benzersiz olup olmadığını business logic ile kontrol edin
    this.roleBusinessLogic.validateRoleNameUniqueness(roleWithSameName);

    Object.assign(existingRole, role);
    const updatedRole = await this.rolesRepository.save(existingRole);

    if (permissionIds.length > 0) {
      return this.assignPermissionsToRole(updatedRole.id, permissionIds);
    }

    return updatedRole;
  }

  async softRemove(id: string): Promise<{ message: string }> {
    const role = await this.findOne(id);

    await this.rolesRepository.softDelete(id);

    // Soft delete mesajını business logic ile oluştur
    return { message: this.roleBusinessLogic.generateSoftDeleteMessage(role.name) };
  }

  async restore(id: string): Promise<{ message: string }> {
    const role = await this.findOne(id);

    await this.rolesRepository.restore(id);

    // Restore mesajını business logic ile oluştur
    return { message: this.roleBusinessLogic.generateRestoreMessage(role.name) };
  }

  async remove(id: string): Promise<{ message: string }> {
    // Rolü bul
    const role = await this.findOne(id);
  
    // Eğer rol soft delete yapılmışsa geri yüklemeden silinmesini engelle
    this.roleBusinessLogic.validateNotSoftDeleted(role);
  
    // İlişkileri kaldır
    await this.removeRoleRelations(id);
  
    // Rolü kalıcı olarak sil
    await this.rolesRepository.delete(id);
  
    // Mesajı döndür
    return { message: this.roleBusinessLogic.generateHardDeleteMessage(role.name) };
  }
  

  async findAll(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Rollerin varlığını business logic ile kontrol et
    this.roleBusinessLogic.validateRolesExist(roles);

    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }

  async findAllInactive(page: number, limit: number): Promise<{ roles: Role[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Pasif rollerin varlığını business logic ile kontrol et
    this.roleBusinessLogic.validateInactiveRolesExist(roles);

    const totalPages = Math.ceil(total / limit);
    return { roles, total, totalPages };
  }

  async removeRoleRelations(roleId: string): Promise<void> {
    const role = await this.findOne(roleId);

    // Yetkiler ve kullanıcılarla olan ilişkileri kaldır
    await this.rolesRepository
      .createQueryBuilder()
      .relation(Role, 'permissions')
      .of(role)
      .remove(role.permissions);

    await this.rolesRepository
      .createQueryBuilder()
      .relation(Role, 'users')
      .of(role)
      .remove(role.users);
  }
}
