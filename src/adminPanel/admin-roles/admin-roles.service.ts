import { Injectable } from '@nestjs/common';
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
  findAll(): Promise<Role[]> {
    return this.rolesRepository.find();
  }

  // Tüm pasif rolleri getirir (soft delete yapılmış olanlar)
  findAllInactive(): Promise<Role[]> {
    return this.rolesRepository.find({
      where: {
        deletedAt: Not(IsNull()), // deletedAt dolu olanlar
      },
      withDeleted: true, // Silinmiş olanlar da dahil edilmesini sağlar
    });
  }

  // Silinmiş roller de dahil olmak üzere tüm rolleri getirir
  findAllIncludingDeleted(): Promise<Role[]> {
    return this.rolesRepository.find({ withDeleted: true });
  }

  // Belirli bir rolü getirir, soft delete yapılmış roller de dahil
  findOne(id: string): Promise<Role> {
    return this.rolesRepository.findOne({
      where: { id },
      withDeleted: true, // Silinmiş rolleri de aramaya dahil eder
    });
  }

  // Yeni bir rol oluşturur
  create(role: Role): Promise<Role> {
    return this.rolesRepository.save(role);
  }

  // Belirli bir rolü günceller
  update(role: Role): Promise<Role> {
    return this.rolesRepository.save(role);
  }

  // Soft delete işlemi (Rolü pasif yapar)
  async softRemove(id: string): Promise<void> {
    await this.rolesRepository.softDelete(id);
  }

  // Soft delete yapılmış rolü geri yükler
  async restore(id: string): Promise<void> {
    await this.rolesRepository.restore(id);
  }

  // Kalıcı olarak siler (Hard delete)
  async remove(id: string): Promise<void> {
    await this.rolesRepository.delete(id);
  }
}
