import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Permission } from 'src/entities/permission.entity';
import { PermissionsBusinessLogic } from './permissions-business.logic';
import { ModelMapperService } from 'src/model-mapper/model-mapper.service';
import { CreatePermissionRequestDto } from './dto/create-permission-request.dto';
import { CreatePermissionResponseDto } from './dto/create-permission-response.dto';
import { FindAllPermissionsResponseDto } from './dto/find-all-permissions-response.dto';
import { AdminRolesService } from '../roles/admin-roles.service';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly permissionsLogic: PermissionsBusinessLogic,
    private readonly modelMapper: ModelMapperService,
    @Inject(forwardRef(() => AdminRolesService))
    private readonly roleService: AdminRolesService,
  ) {}

  async findByIds(permissionIds: string[]): Promise<FindAllPermissionsResponseDto[]> {
    const permissions = await this.permissionsRepository.findBy({ id: In(permissionIds) });
    this.permissionsLogic.validatePermissionsExist(permissions, permissionIds);
    return permissions.map(permission => this.modelMapper.mapToDto(permission, FindAllPermissionsResponseDto));
  }

  async findAll(page: number, limit: number): Promise<{ permissions: FindAllPermissionsResponseDto[], total: number, totalPages: number }> {
    const [permissions, total] = await this.permissionsRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
    });
    this.permissionsLogic.validatePermissionsExist(permissions);
    const totalPages = this.permissionsLogic.calculateTotalPages(total, limit);
    const permissionsDto = permissions.map(permission => this.modelMapper.mapToDto(permission, FindAllPermissionsResponseDto));
    return { permissions: permissionsDto, total, totalPages };
  }

  async findAllIncludingDeleted(page: number, limit: number): Promise<{ permissions: FindAllPermissionsResponseDto[], total: number, totalPages: number }> {
    const [permissions, total] = await this.permissionsRepository.findAndCount({
      withDeleted: true,
      skip: (page - 1) * limit,
      take: limit,
    });
    this.permissionsLogic.validatePermissionsExist(permissions);
    const totalPages = this.permissionsLogic.calculateTotalPages(total, limit);
    const permissionsDto = permissions.map(permission => this.modelMapper.mapToDto(permission, FindAllPermissionsResponseDto));
    return { permissions: permissionsDto, total, totalPages };
  }

  async findAllInactive(page: number, limit: number): Promise<{ permissions: FindAllPermissionsResponseDto[], total: number, totalPages: number }> {
    const [permissions, total] = await this.permissionsRepository.findAndCount({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      skip: (page - 1) * limit,
      take: limit,
    });
    this.permissionsLogic.validatePermissionsExist(permissions);
    const totalPages = this.permissionsLogic.calculateTotalPages(total, limit);
    const permissionsDto = permissions.map(permission => this.modelMapper.mapToDto(permission, FindAllPermissionsResponseDto));
    return { permissions: permissionsDto, total, totalPages };
  }

  async findOne(id: string): Promise<FindAllPermissionsResponseDto> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['roles'],
    });
  
    this.permissionsLogic.validatePermissionExists(permission, id);
  
    const roles = permission.roles ? permission.roles.map(role => role.name) : [];
  
    return {
      ...this.modelMapper.mapToDto(permission, FindAllPermissionsResponseDto),
      roles,
    };
  }

  async create(createPermissionDto: CreatePermissionRequestDto): Promise<CreatePermissionResponseDto> {
    const existingPermission = await this.permissionsRepository.findOne({ where: { name: createPermissionDto.name }, withDeleted: true });
    this.permissionsLogic.validatePermissionNameUniqueness(existingPermission);

    const permission = this.modelMapper.mapToEntity(createPermissionDto, Permission);
    const savedPermission = await this.permissionsRepository.save(permission);
    return this.modelMapper.mapToDto(savedPermission, CreatePermissionResponseDto);
  }

  async update(id: string, updatePermissionDto: CreatePermissionRequestDto): Promise<CreatePermissionResponseDto> {
    const existingPermission = await this.permissionsRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  
    this.permissionsLogic.validatePermissionExists(existingPermission, id);
  
    const roles = updatePermissionDto.roles 
      ? await this.roleService.findByIds(updatePermissionDto.roles)
      : existingPermission.roles;
  
    const updatedPermission = this.modelMapper.mapToEntity(updatePermissionDto, Permission);
    updatedPermission.roles = roles;
  
    const savedPermission = await this.permissionsRepository.save(updatedPermission);
    return this.modelMapper.mapToDto(savedPermission, CreatePermissionResponseDto);
  }
  

  async softRemove(id: string): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.softDelete(id);
    return this.permissionsLogic.generateMessage('soft delete ile pasif yapıldı', permission.name);
  }

  async restore(id: string): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    await this.permissionsRepository.restore(id);
    return this.permissionsLogic.generateMessage('geri yüklendi', permission.name);
  }

  async remove(id: string): Promise<{ message: string }> {
    const permission = await this.permissionsRepository.findOne({
        where: { id },
        relations: ['roles'],
    });

    this.permissionsLogic.validatePermissionExists(permission, id);

    await this.permissionsRepository
        .createQueryBuilder()
        .relation(Permission, 'roles')
        .of(permission)
        .remove(permission.roles);

    await this.permissionsRepository.delete(id);

    return this.permissionsLogic.generateMessage('kalıcı olarak silindi', permission.name);
}

  
}
