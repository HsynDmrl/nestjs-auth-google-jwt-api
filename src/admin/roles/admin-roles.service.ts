import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { AdminRolesBusinessLogic } from './admin-roles-business.logic';
import { CreateRoleRequestDto } from './requests/concretes/create-role-request.dto';
import { UpdateRoleRequestDto } from './requests/concretes/update-role-request.dto';
import { ActiveAllRolesResponseDto } from './responses/concretes/operations/active-all-roles-response.dto';
import { InactiveAllRolesResponseDto } from './responses/concretes/operations/inactive-all-roles-response.dto';
import { FindAllRolesResponseDto } from './responses/concretes/operations/find-all-roles-response.dto';
import { GetByIdRolesResponseDto } from './responses/concretes/operations/getById-roles-resoonse.dto';
import { CreateRolesResponseDto } from './responses/concretes/operations/create-roles-response.dto';
import { UpdateRoleResponseDto } from './responses/concretes/operations/update-role-response.dto';
import { ModelMapperService } from 'src/model-mapper/model-mapper.service';
import { PermissionsService } from '../permissions/permissions.service';
import { FindByIdsRolesResponseDto } from './responses/concretes/operations/findByIds-roles-response.dto';
import { SoftDeleteRoleResponseDto } from './responses/concretes/status/soft-delete-role-response.dto';

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly roleBusinessLogic: AdminRolesBusinessLogic,
    private readonly permissionsService: PermissionsService,
    private readonly modelMapper: ModelMapperService,
  ) { }

  async findByIds(ids: string[]): Promise<FindByIdsRolesResponseDto[]> {
    const roles = await this.rolesRepository.findBy({ id: In(ids) });
    return roles.map(role => this.modelMapper.mapToDto(role, FindByIdsRolesResponseDto));
  }

  async findAllIncludingDeleted(page: number, limit: number): Promise<{ roles: FindAllRolesResponseDto[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      withDeleted: true,
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });

    this.roleBusinessLogic.validateRolesExist(roles);

    const totalPages = Math.ceil(total / limit);
    return {
      roles: roles.map(role => this.modelMapper.mapToDto(role, FindAllRolesResponseDto)),
      total,
      totalPages
    };
  }

  async findOne(id: string): Promise<GetByIdRolesResponseDto> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      withDeleted: true, // Soft delete olanları da bulabilmek için
      relations: ['permissions'],
    });
  
    this.roleBusinessLogic.validateRoleExists(role, id);

    return {
      ...this.modelMapper.mapToDto(role, GetByIdRolesResponseDto)
    };
  }

  async create(createRoleDto: CreateRoleRequestDto): Promise<CreateRolesResponseDto> {
    // Rol adıyla daha önce oluşturulmuş bir rol olup olmadığını kontrol et
    const existingRole = await this.rolesRepository.findOne({
      where: { name: createRoleDto.name },
      withDeleted: true
    });

    // Eğer aynı isimde bir rol varsa, exception fırlat
    this.roleBusinessLogic.validateRoleNameUniqueness(existingRole);

    // Permissions'ları al
    const permissionIds = createRoleDto.permissionsIds;
    const permissions = await this.permissionsService.findByIds(permissionIds);
    this.roleBusinessLogic.validatePermissionsExist(permissions);

    // DTO'yu Role entity'sine çevir ve permissions'ları ekle
    const newRole = this.modelMapper.mapToEntity(createRoleDto, Role);
    newRole.permissions = permissions;

    // Yeni rolü kaydet
    const createdRole = await this.rolesRepository.save(newRole);
    return this.modelMapper.mapToDto(createdRole, CreateRolesResponseDto);
  }

  async update(id: string, updateRoleDto: UpdateRoleRequestDto): Promise<UpdateRoleResponseDto> {
    // Rolün var olup olmadığını kontrol et
    const existingRole = await this.rolesRepository.findOne({
      where: { id },
      relations: ['permissions'],
      withDeleted: true,
    });
  
    this.roleBusinessLogic.validateRoleExists(existingRole, id);
  
    // Aynı ada sahip başka bir rol olup olmadığını kontrol et
    const roleWithSameName = await this.rolesRepository.findOne({
      where: { name: updateRoleDto.name, id: Not(id) },
      withDeleted: true
    });
    this.roleBusinessLogic.validateRoleNameUniqueness(roleWithSameName);
  
    // Yeni gelen permissionsIds'den permissions'ları al
    const permissionIds = updateRoleDto.permissionsIds;
    const permissions = await this.permissionsService.findByIds(permissionIds);
    this.roleBusinessLogic.validatePermissionsExist(permissions);
  
    // Role'ün sadece gerekli alanlarını güncelle
    existingRole.name = updateRoleDto.name;
    existingRole.permissions = permissions;
    existingRole.updatedAt = new Date();

    const updatedRole = await this.rolesRepository.save(existingRole);
  
    // DTO'ya dönüştür ve geri döndür
    return this.modelMapper.mapToDto(updatedRole, UpdateRoleResponseDto);
  }
  

  async softRemove(id: string): Promise<SoftDeleteRoleResponseDto> {
    const role = await this.findOne(id);
    
    // Eğer rol zaten soft delete yapılmışsa hata fırlat
    this.roleBusinessLogic.validateNotSoftDeleted(role);

    await this.rolesRepository.softDelete(id);
    return {
      message: this.roleBusinessLogic.generateSoftDeleteMessage(role.name),
      roleName: role.name,
    }
  }

  async restore(id: string): Promise<SoftDeleteRoleResponseDto> {
    const role = await this.findOne(id);
    
    // Eğer rol soft delete yapılmamışsa hata fırlat
    this.roleBusinessLogic.validateSoftDeleted(role);

    await this.rolesRepository.restore(id);
    return {
      message: this.roleBusinessLogic.generateRestoreMessage(role.name),
      roleName: role.name,
    }
  }

  async remove(id: string): Promise<SoftDeleteRoleResponseDto> {
    const role = await this.findOne(id);
    
    // Eğer rol soft delete yapılmışsa, kalıcı silme yapılamaz
    this.roleBusinessLogic.validateNotSoftDeleted(role);

    await this.rolesRepository.delete(id);
    return {
      message: this.roleBusinessLogic.generateHardDeleteMessage(role.name),
      roleName: role.name,
    }
  }

  async findAll(page: number, limit: number): Promise<{ roles: ActiveAllRolesResponseDto[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });

    this.roleBusinessLogic.validateRolesExist(roles);

    const totalPages = Math.ceil(total / limit);
    return {
      roles: roles.map(role => this.modelMapper.mapToDto(role, ActiveAllRolesResponseDto)),
      total,
      totalPages
    };
  }

  async findAllInactive(page: number, limit: number): Promise<{ roles: InactiveAllRolesResponseDto[], total: number, totalPages: number }> {
    const [roles, total] = await this.rolesRepository.findAndCount({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['permissions'],
      skip: (page - 1) * limit,
      take: limit,
    });

    this.roleBusinessLogic.validateInactiveRolesExist(roles);

    const totalPages = Math.ceil(total / limit);
    return {
      roles: roles.map(role => this.modelMapper.mapToDto(role, InactiveAllRolesResponseDto)),
      total,
      totalPages
    };
  }
}
