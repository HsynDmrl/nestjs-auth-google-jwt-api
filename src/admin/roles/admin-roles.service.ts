import { InactiveAllRolesResponseDto } from './responses/concretes/operations/inactive-all-roles-response.dto';
import { ActiveAllRolesResponseDto } from './responses/concretes/operations/active-all-roles-response.dto';
import { FindByIdsRolesResponseDto } from './responses/concretes/operations/findByIds-roles-response.dto';
import { FindAllRolesResponseDto } from './responses/concretes/operations/find-all-roles-response.dto';
import { GetByIdRolesResponseDto } from './responses/concretes/operations/getById-roles-resoonse.dto';
import { CreateRolesResponseDto } from './responses/concretes/operations/create-roles-response.dto';
import { UpdateRoleResponseDto } from './responses/concretes/operations/update-role-response.dto';
import { RestoreRoleResponseDto } from './responses/concretes/status/restore-role-response.dto';
import { CreateRoleRequestDto } from './requests/concretes/create-role-request.dto';
import { UpdateRoleRequestDto } from './requests/concretes/update-role-request.dto';
import { ModelMapperService } from 'src/model-mapper/model-mapper.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AdminRolesBusinessLogic } from './admin-roles-business.logic';
import { Repository, Not, IsNull, In } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from 'src/entities/role.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AdminRolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    private readonly roleBusinessLogic: AdminRolesBusinessLogic,
    private readonly permissionsService: PermissionsService,
    private readonly modelMapper: ModelMapperService,
  ) { }

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

  async findByIds(roleIds: string[]): Promise<FindByIdsRolesResponseDto[]> {
    const roles = await this.rolesRepository.findBy({ 
      id: In(roleIds) 
    });
    // iş mantığı sınıfında eksik rol ID'lerini kontrol et
    this.roleBusinessLogic.validateAllRolesExist(roleIds, roles);

    // Rol entity'lerini DTO'ya dönüştür
    const rolesDto = roles.map(role => this.modelMapper.mapToDto(role, FindByIdsRolesResponseDto));
    return rolesDto;
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
    const newRole = this.modelMapper.mapToEntity(createRoleDto, CreateRolesResponseDto);
    newRole.permissions = permissions;

    // Yeni rolü kaydet
    const createdRole = await this.rolesRepository.save(newRole);
    return this.modelMapper.mapToDto(createdRole, CreateRolesResponseDto);
  }

  async update(id: string, updateRoleDto: UpdateRoleRequestDto): Promise<UpdateRoleResponseDto> {
    // Rol adıyla daha önce oluşturulmuş bir rol olup olmadığını kontrol et
    const existingRole = await this.rolesRepository.findOne({ where: { id }, withDeleted: true });
    this.roleBusinessLogic.validateRoleExists(existingRole, id);
  
    // Aynı ada sahip başka rol olup olmadığını kontrol et
    const roleWithSameName = await this.rolesRepository.findOne({
      where: { name: updateRoleDto.name, id: Not(id) },
      withDeleted: true
    });
    this.roleBusinessLogic.validateRoleNameUniqueness(roleWithSameName);
  
    // Mevcut rolü bul
    const role = await this.findOne(id);
  
    // Eğer rol soft delete yapılmışsa hata fırlat
    this.roleBusinessLogic.validateNotSoftDeleted(role);
  
    // Permissions'ları al
    if (updateRoleDto.permissionsIds) {
      const permissions = await this.permissionsService.findByIds(updateRoleDto.permissionsIds);
      this.roleBusinessLogic.validatePermissionsExist(permissions);
  
      // Eğer appendPermissions true ise mevcut izinlere ekle, değilse izinleri değiştir
      if (updateRoleDto.appendPermissions) {
        role.permissions = [...role.permissions, ...permissions];
      } else {
        role.permissions = permissions;
      }
    }

    // Değişiklikleri uygulamak için Object.assign kullanımı
    const updatedRole = Object.assign(role, {
      ...(updateRoleDto.name && { name: updateRoleDto.name }),
      updatedAt: new Date() // Güncelleme tarihi
    });
  
    // Rolü güncelle ve kaydet
    const savedRole = await this.rolesRepository.save(updatedRole);
  
    // DTO'ya dönüştür ve geri döndür
    return this.modelMapper.mapToDto(savedRole, UpdateRoleResponseDto);
  }


  async softRemove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    // Eğer rol zaten soft delete yapılmışsa hata fırlat
    this.roleBusinessLogic.validateNotSoftDeleted(role);

    await this.rolesRepository.softDelete(id);
  }

  async restore(id: string): Promise<RestoreRoleResponseDto> {
    const role = await this.findOne(id);
    
    // Eğer rol soft delete yapılmamışsa hata fırlat
    this.roleBusinessLogic.validateSoftDeleted(role);

    await this.rolesRepository.restore(id);
    return {
      message: this.roleBusinessLogic.generateRestoreMessage(role.name),
      roleName: role.name,
    }
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    
    // Eğer rol soft delete yapılmışsa, kalıcı silme yapılamaz
    this.roleBusinessLogic.validateNotSoftDeleted(role);

    await this.rolesRepository.delete(id);
  }

  
}
