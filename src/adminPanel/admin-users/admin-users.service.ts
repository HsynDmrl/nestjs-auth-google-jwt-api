import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Repository, Not, IsNull } from 'typeorm';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) { }

  // Tüm kullanıcıları getirir (Soft delete yapılmamış olanlar)
  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  // Tüm kullanıcıları getirir (Soft delete yapılmış olanlar dahil)
  findAllIncludingDeleted(): Promise<User[]> {
    return this.usersRepository.find({ withDeleted: true });
  }

  // Soft delete yapılmış kullanıcıları getirir (deletedAt sütunu dolu olanlar)
  findAllInactive(): Promise<User[]> {
    return this.usersRepository.find({
      where: {
        deletedAt: Not(IsNull()), // deletedAt dolu olanlar
      },
      withDeleted: true, // Silinmiş olanlar da dahil edilmesini sağlar
    });
  }

  // Belirli bir kullanıcıyı getirir, soft delete yapılmış kullanıcılar da dahil
  findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({
      where: { id },
      withDeleted: true, // Silinmiş kullanıcıları da aramaya dahil eder
    });
  }

  // Yeni bir kullanıcı oluşturur
  create(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  // Belirli bir kullanıcıyı günceller
  update(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  // Soft delete işlemi (Kullanıcıyı pasif yapar)
  async softRemove(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  // Soft delete yapılmış kullanıcıyı geri yükler
  async restore(id: string): Promise<void> {
    await this.usersRepository.restore(id);
  }

  // Kalıcı olarak siler (Hard delete)
  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
