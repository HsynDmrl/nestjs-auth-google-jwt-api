import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
import { Permission } from 'src/entities/permission.entity';
import { PermissionsBusinessLogic } from './permissions-business.logic';
import { ModelMapperService } from 'src/model-mapper/model-mapper.service';
import { CreatePermissionResponseDto } from './dto/responses/concretes/operations/create-permission-response.dto';
import { FindAllPermissionsResponseDto } from './dto/responses/concretes/operations/find-all-permissions-response.dto';
import { UpdatePermissionResponseDto } from './dto/responses/concretes/operations/update-permission-response.dto';
import { CreatePermissionRequestDto } from './dto/requests/concretes/create-permission-request.dto';
import { UpdatePermissionRequestDto } from './dto/requests/concretes/update-permission-request.dto';
import { SoftDeletePermissionResponseDto } from './dto/responses/concretes/status/soft-delete-permission-response.dto';
import { RestorePermissionResponseDto } from './dto/responses/concretes/status/restore-permission-response.dto';
import { FindByIdsPermissionsResponseDto } from './dto/responses/concretes/operations/findByIds-permissions-response.dto';
import { GetByIdPermissionsResponseDto } from './dto/responses/concretes/operations/getById-permissions-resoonse.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
    private readonly permissionsLogic: PermissionsBusinessLogic,
    private readonly modelMapper: ModelMapperService,
  ) {}

  
  async findByIds(permissionIds: string[]): Promise<FindByIdsPermissionsResponseDto[]> {
    const permissions = await this.permissionsRepository.findBy({ 
      id: In(permissionIds) 
    });
  
    // İş mantığı sınıfında eksik yetki ID'lerini kontrol et
    this.permissionsLogic.validateAllPermissionsExist(permissionIds, permissions);
  
    // Permission entity'lerini DTO'ya dönüştür
    const permissionsDto = permissions.map(permission => this.modelMapper.mapToDto(permission, FindByIdsPermissionsResponseDto));
    
    return permissionsDto;
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

  async findOne(id: string): Promise<GetByIdPermissionsResponseDto> {
    const permission = await this.permissionsRepository.findOne({
      where: { id },
      withDeleted: true
    });
  
    this.permissionsLogic.validatePermissionExists(permission, id);
  
    return {
      ...this.modelMapper.mapToDto(permission, GetByIdPermissionsResponseDto)
    };
  }

  async create(createPermissionDto: CreatePermissionRequestDto): Promise<CreatePermissionResponseDto> {
    const existingPermission = await this.permissionsRepository.findOne({ where: { name: createPermissionDto.name }, withDeleted: true });
    this.permissionsLogic.validatePermissionNameUniqueness(existingPermission);

    const permission = this.modelMapper.mapToEntity(createPermissionDto, Permission);
    const savedPermission = await this.permissionsRepository.save(permission);
    return this.modelMapper.mapToDto(savedPermission, CreatePermissionResponseDto);
  }

  async update(id: string, updatePermissionDto: UpdatePermissionRequestDto): Promise<UpdatePermissionResponseDto> {
    // Var olan yetkiyi bul
    const existingPermission = await this.permissionsRepository.findOne({
      where: { id }
    });
  
    // Eğer var olan bir yetki yoksa, NotFoundException fırlat
    this.permissionsLogic.validatePermissionExists(existingPermission, id);
  
    // Var olan yetkinin sadece güncellenen alanlarını değiştirmek için Object.assign
    const updatedPermission = Object.assign(existingPermission, updatePermissionDto);
  
    // Güncellenen yetkiyi kaydet
    const savedPermission = await this.permissionsRepository.save(updatedPermission);
  
    // Kaydedilen yetkiyi DTO'ya dönüştürüp döndür
    return this.modelMapper.mapToDto(savedPermission, UpdatePermissionResponseDto);
  }
  
  
  async softRemove(id: string): Promise<SoftDeletePermissionResponseDto> {
    const permission = await this.findOne(id);
    
    // Zaten soft delete yapılmış mı kontrol et
    this.permissionsLogic.validateNotSoftDeleted(permission);
  
    await this.permissionsRepository.softDelete(id);
    return {
      message: this.permissionsLogic.generateSoftDeleteMessage(permission.name),
      permissionName: permission.name,
    };
  }
  
  async restore(id: string): Promise<RestorePermissionResponseDto> {
    const permission = await this.findOne(id);
  
    // Sadece soft delete yapılmış yetkileri geri yükle
    this.permissionsLogic.validateSoftDeleted(permission);
  
    await this.permissionsRepository.restore(id);
    return {
      message: this.permissionsLogic.generateRestoreMessage(permission.name),
      permissionName: permission.name,
    };
  }
  
  async remove(id: string): Promise<{ message: string }> {
    const permission = await this.findOne(id);
    this.permissionsLogic.validateNotSoftDeleted(permission);

    await this.permissionsRepository.delete(id);
    return { message: this.permissionsLogic.generateHardDeleteMessage(permission.name) };
  }
  
  
  
}
