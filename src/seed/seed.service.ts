import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { User } from 'src/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    const permissions = ['create', 'read', 'update', 'delete'];
    for (const permissionName of permissions) {
      const permissionExists = await this.permissionRepository.findOne({ where: { name: permissionName } });
      if (!permissionExists) {
        const permission = this.permissionRepository.create({ name: permissionName });
        await this.permissionRepository.save(permission);
      }
    }

    // User rolü mevcut mu kontrol et
    const userRoleExists = await this.roleRepository.findOne({ where: { name: 'user' }, relations: ['permissions'] });
    if (!userRoleExists) {
      const userRole = this.roleRepository.create({ name: 'user', permissions: await this.getBasicPermissions() });
      await this.roleRepository.save(userRole);
    }

    // Admin rolü mevcut mu kontrol et
    const adminRoleExists = await this.roleRepository.findOne({ where: { name: 'admin' }, relations: ['permissions'] });
    if (!adminRoleExists) {
      const adminRole = this.roleRepository.create({ name: 'admin', permissions: await this.getAllPermissions() });
      await this.roleRepository.save(adminRole);
    }

    // Admin kullanıcısı mevcut mu kontrol et
    const adminUserExists = await this.userRepository.findOne({ where: { email: 'admin@admin.com' }, relations: ['roles'] });
    if (!adminUserExists) {
      const adminUser = this.userRepository.create({
        name: 'Admin',
        surname: 'User',
        email: 'admin@admin.com',
        password: await bcrypt.hash('admin', 10),
        roles: [await this.roleRepository.findOne({ where: { name: 'admin' }, relations: ['permissions'] })],
        emailConfirmed: true,
      });
      await this.userRepository.save(adminUser);
    }
  }

  // Temel yetkileri alma fonksiyonu
  private async getBasicPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({ where: { name: 'read' } });
  }

  // Tüm yetkileri alma fonksiyonu
  private async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }
}
