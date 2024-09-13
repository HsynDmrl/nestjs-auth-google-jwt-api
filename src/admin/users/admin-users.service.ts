import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository, Not, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ModelMapperService } from 'src/model-mapper/model-mapper.service';
import { ActiveAllAdminUsersResponseDto } from './responses/concretes/operations/active-all-admin-users-response.dto';
import { AdminUsersBusinessLogic } from './admin-users-business.logic';
import { FindAllAdminUsersResponseDto } from './responses/concretes/operations/find-all-admin-users-response.dto';
import { InactiveAllAdminUsersResponseDto } from './responses/concretes/operations/inactive-all-admin-users-response.dto';
import { GetByIdAdminUsersResponseDto } from './responses/concretes/operations/getById-admin-users-resoonse.dto';
import { CreateAdminUserRequestDto } from './requests/concretes/create-admin-users-request.dto';
import { CreateAdminUsersResponseDto } from './responses/concretes/operations/create-admin-users-response.dto';
import { AdminRolesService } from '../roles/admin-roles.service';
import { UpdateAdminUserRequestDto } from './requests/concretes/update-admin-users-request.dto';
import { UpdateAdminUserResponseDto } from './responses/concretes/operations/update-admin-users-response.dto';
import { SoftDeleteAdminUserResponseDto } from './responses/concretes/status/soft-delete-admin-users-response.dto';
import { RestoreAdminUserResponseDto } from './responses/concretes/status/restore-admin-users-response.dto';
import { HardDeleteAdminUsersResponseDto } from './responses/concretes/status/hard-delete-admin-users-response.dto';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly modelMapper: ModelMapperService,
    private readonly userBusinessLogic: AdminUsersBusinessLogic,
    private readonly rolesService: AdminRolesService,
  ) {}

  // Tüm kullanıcıları getirir (Soft delete yapılmamış olanlar)
  async findAll(page: number, limit: number): Promise<{ users: ActiveAllAdminUsersResponseDto[], total: number, totalPages: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });
    this.userBusinessLogic.validateUsersExist(users);

    const totalPages = Math.ceil(total / limit);
    return { users: users.map(user => this.modelMapper.mapToDto(user, ActiveAllAdminUsersResponseDto)),
      total,
      totalPages 
    };
  }

  // Tüm kullanıcıları getirir (Soft delete yapılmış olanlar dahil)
  async findAllIncludingDeleted(page: number, limit: number): Promise<{ users: FindAllAdminUsersResponseDto[], total: number, totalPages: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      withDeleted: true,
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });
    this.userBusinessLogic.validateUsersExist(users);

    const totalPages = Math.ceil(total / limit);
    return { users: users.map(user => this.modelMapper.mapToDto(user, FindAllAdminUsersResponseDto)),
      total,
      totalPages 
    };
  }

  // Soft delete yapılmış kullanıcıları getirir (deletedAt sütunu dolu olanlar)
  async findAllInactive(page: number, limit: number): Promise<{ users: InactiveAllAdminUsersResponseDto[], total: number, totalPages: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      where: {
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });

    this.userBusinessLogic.validateInactiveUsersExist(users);

    const totalPages = Math.ceil(total / limit);
    return { users: users.map(user => this.modelMapper.mapToDto(user, InactiveAllAdminUsersResponseDto)),
      total,
      totalPages 
    };
  }

  // Belirli bir kullanıcıyı getirir, soft delete yapılmış kullanıcılar da dahil
  async findOne(id: string): Promise<GetByIdAdminUsersResponseDto> {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['roles'],
    });

    this.userBusinessLogic.validateUserExists(user, id);


    return { 
      ...this.modelMapper.mapToDto(user, GetByIdAdminUsersResponseDto) 
    };
  }

  // Yeni bir kullanıcı oluşturur
  async create(createAdminUserDto: CreateAdminUserRequestDto): Promise<CreateAdminUsersResponseDto> {
    // Business Logic: Check if the user with the same email already exists
    const existingUser = await this.usersRepository.findOne({ 
      where: { email: createAdminUserDto.email }, 
      withDeleted: true 
    });
    this.userBusinessLogic.validateUserNamesUniqueness(existingUser);

    // Rolleri kontrol et
    const rolesIds = createAdminUserDto.roleIds;
    const roles = await this.rolesService.findByIds(rolesIds);
    this.userBusinessLogic.validateRolesExist(roles);

    
    // Şifreyi hashleme
    if (createAdminUserDto.password) {
      createAdminUserDto.password = await bcrypt.hash(createAdminUserDto.password, 10);
    }
    
    // DTO'yu User Entity çevir ve role'leri ekle
    const newUser = this.modelMapper.mapToEntity(createAdminUserDto, CreateAdminUsersResponseDto);
    newUser.roles = roles;
    
    // Yeni kullanıcıyı kaydet
    const createdUser = await this.usersRepository.save(newUser);
    return this.modelMapper.mapToDto(createdUser, CreateAdminUsersResponseDto);
  }

  // Belirli bir kullanıcıyı günceller
  async update(id: string, updateAdminUserDto: UpdateAdminUserRequestDto): Promise<UpdateAdminUserResponseDto> {
    // Mevcut kullanıcıyı bul
    const existingUser = await this.findOne(id);
  
    // Kullanıcının var olduğunu doğrula
    this.userBusinessLogic.validateUserExists(existingUser, id);
  
    // Aynı ada sahip başka user olup olmadığını kontrol et
    if (updateAdminUserDto.name) {
      const userWithSameName = await this.usersRepository.findOne({
        where: { name: updateAdminUserDto.name, id: Not(id) },
        withDeleted: true,
      });
      this.userBusinessLogic.validateUserNamesUniqueness(userWithSameName);
    }
  
    // Rolleri güncellemeden önce kontrol et
    if (updateAdminUserDto.roleIds) {
      const roles = await this.rolesService.findByIds(updateAdminUserDto.roleIds);
      //this.userBusinessLogic.validateRolesExist(roles);
      
      // Eğer appendRoles true ise mevcut rollere ekle, değilse rolleri değiştir
      if (updateAdminUserDto.appendRoles) {
        existingUser.roles = [...existingUser.roles, ...roles];
      } else {
        existingUser.roles = roles;
      }
    }
  
    // Değişiklikleri uygulamak için Object.assign kullanımı
    const updatedUser = Object.assign(existingUser, {
      ...(updateAdminUserDto.name && { name: updateAdminUserDto.name }),
      ...(updateAdminUserDto.surname && { surname: updateAdminUserDto.surname }),
      ...(updateAdminUserDto.email && { email: updateAdminUserDto.email }),
      ...(updateAdminUserDto.emailConfirmed !== undefined && { emailConfirmed: updateAdminUserDto.emailConfirmed }),
    });
  
    // Şifreyi günceller ve hashler, eğer şifre gönderilmişse
    if (updateAdminUserDto.password) {
      updatedUser.password = await bcrypt.hash(updateAdminUserDto.password, 10);
    }
  
    updatedUser.updatedAt = new Date();
  
    // Kullanıcıyı güncelle ve kaydet
    const savedUser = await this.usersRepository.save(updatedUser);
  
    // DTO'ya çevir ve geri dön
    return this.modelMapper.mapToDto(savedUser, UpdateAdminUserResponseDto);
  }
  
  // Soft delete işlemi (Kullanıcıyı pasif yapar)
  async softRemove(id: string): Promise<SoftDeleteAdminUserResponseDto> {
    const user = await this.findOne(id);

    // Eğer kullanıcı zaten soft delete yapılmışsa hata fırlat
    this.userBusinessLogic.validateNotSoftDeleted(user);

    await this.usersRepository.softDelete(id);
    return {
      message: this.userBusinessLogic.generateSoftDeleteMessage(user.name),
      userName: user.name,
    }    
  }

  // Soft delete yapılmış kullanıcıyı geri yükler
  async restore(id: string): Promise<RestoreAdminUserResponseDto> {
    const user = await this.findOne(id);

    // Eğer kullanıcı soft delete yapılmamışsa hata fırlat
    this.userBusinessLogic.validateSoftDeleted(user);
    
    await this.usersRepository.restore(id);
    return {
      message: this.userBusinessLogic.generateRestoreMessage(user.name),
      userName: user.name,
    }
  }

  // Kalıcı olarak siler (Hard delete)
  async remove(id: string): Promise<HardDeleteAdminUsersResponseDto> {
    const user = await this.findOne(id); 

    // Eğer kullanıcı soft delete yapılmışsa, kalıcı silme yapılamaz
    this.userBusinessLogic.validateNotSoftDeleted(user);

    await this.usersRepository.delete(id);
    return {
      message: this.userBusinessLogic.generateHardDeleteMessage(user.name),
      userName: user.name,
    }
  }
}