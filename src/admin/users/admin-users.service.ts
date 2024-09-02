import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/entities/user.entity';
import { Role } from 'src/entities/role.entity';
import { Repository, Not, IsNull, In } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,

    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  // Tüm kullanıcıları getirir (Soft delete yapılmamış olanlar)
  async findAll(page: number, limit: number): Promise<{ users: User[], total: number, totalPages: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });
    if (users.length === 0) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { users, total, totalPages };
  }

  // Tüm kullanıcıları getirir (Soft delete yapılmış olanlar dahil)
  async findAllIncludingDeleted(page: number, limit: number): Promise<{ users: User[], total: number, totalPages: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      withDeleted: true,
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });
    if (users.length === 0) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { users, total, totalPages };
  }

  // Soft delete yapılmış kullanıcıları getirir (deletedAt sütunu dolu olanlar)
  async findAllInactive(page: number, limit: number): Promise<{ users: User[], total: number, totalPages: number }> {
    const [users, total] = await this.usersRepository.findAndCount({
      where: {
        deletedAt: Not(IsNull()),
      },
      withDeleted: true,
      relations: ['roles'],
      skip: (page - 1) * limit,
      take: limit,
    });
    if (users.length === 0) {
      throw new NotFoundException('Pasif kullanıcı bulunamadı');
    }
    const totalPages = Math.ceil(total / limit);
    return { users, total, totalPages };
  }

  // Belirli bir kullanıcıyı getirir, soft delete yapılmış kullanıcılar da dahil
  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      withDeleted: true,
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`Kullanıcı ID'si ${id} olan kullanıcı bulunamadı`);
    }
    return user;
  }

  // Yeni bir kullanıcı oluşturur
  async create(user: User, roleIds: string[]): Promise<User> {
    // Business Logic: Check if the user with the same email already exists
    const existingUser = await this.usersRepository.findOne({ where: { email: user.email }, withDeleted: true });
    if (existingUser) {
      throw new BadRequestException('Bu email ile kayıtlı bir kullanıcı zaten mevcut.');
    }

    const roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    if (roles.length === 0) {
      throw new BadRequestException('Geçerli roller seçilmedi.');
    }

    // Şifreyi hashleme
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    user.roles = roles;
    user.emailConfirmed = true;
    const createdUser = await this.usersRepository.save(user);

    return createdUser;
  }

  // Belirli bir kullanıcıyı günceller
  async update(id: string, user: User, roleIds: string[]): Promise<User> {
    const existingUser = await this.findOne(id); // findOne metodu zaten kullanıcıyı bulamazsa exception atar

    const roles = await this.rolesRepository.findBy({ id: In(roleIds) });
    if (roles.length === 0) {
      throw new BadRequestException('Geçerli roller seçilmedi.');
    }

    // Şifreyi güncellenmişse hashleme
    if (user.password && user.password !== existingUser.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    existingUser.roles = roles;
    Object.assign(existingUser, user);
    const updatedUser = await this.usersRepository.save(existingUser);

    return updatedUser;
  }

  // Soft delete işlemi (Kullanıcıyı pasif yapar)
  async softRemove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id); // Kullanıcı yoksa exception atar
    await this.usersRepository.softDelete(id);
    return { message: `Kullanıcı ${user.email} soft delete ile pasif yapıldı.` };
  }

  // Soft delete yapılmış kullanıcıyı geri yükler
  async restore(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id); // Kullanıcı yoksa exception atar
    await this.usersRepository.restore(id);
    return { message: `Kullanıcı ${user.email} geri yüklendi.` };
  }

  // Kalıcı olarak siler (Hard delete)
  async remove(id: string): Promise<{ message: string }> {
    const user = await this.findOne(id); // Kullanıcı yoksa exception atar
    await this.usersRepository.delete(id);
    return { message: `Kullanıcı ${user.email} kalıcı olarak silindi.` };
  }
}
