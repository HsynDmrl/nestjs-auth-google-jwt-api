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
    const userPermissions = [
      'user_read_profile',
      'user_edit_profile',
      'user_delete_profile',
      'user_change_password',
      'user_refresh_token'
    ];

    const adminRolePermissions = [
      'admin_read_roles',
      'admin_create_role',
      'admin_edit_role',
      'admin_delete_role',
      'user_refresh_token'
    ];

    const adminUserPermissions = [
      'admin_read_users',
      'admin_create_user',
      'admin_edit_user',
      'admin_delete_user',
      'user_refresh_token'
    ];

    // Tüm izinleri bir araya getir
    const permissions = [
      ...userPermissions,
      ...adminRolePermissions,
      ...adminUserPermissions
    ];

    // İzinleri veritabanında oluştur
    for (const permissionName of permissions) {
      const permissionExists = await this.permissionRepository.findOne({ where: { name: permissionName } });
      if (!permissionExists) {
        const permission = this.permissionRepository.create({ name: permissionName });
        await this.permissionRepository.save(permission);
      }
    }

    // User rolü mevcut mu kontrol et ve userPermissions izinleriyle oluştur
    const userRoleExists = await this.roleRepository.findOne({ where: { name: 'user' }, relations: ['permissions'] });
    if (!userRoleExists) {
      const userRolePermissions = await this.permissionRepository.find({ where: userPermissions.map(name => ({ name })) });
      const userRole = this.roleRepository.create({ name: 'user', permissions: userRolePermissions });
      await this.roleRepository.save(userRole);
    }

    // Admin rolü mevcut mu kontrol et ve tüm izinlerle oluştur
    const adminRoleExists = await this.roleRepository.findOne({ where: { name: 'admin' }, relations: ['permissions'] });
    if (!adminRoleExists) {
      const adminRolePermissions = await this.permissionRepository.find();
      const adminRole = this.roleRepository.create({ name: 'admin', permissions: adminRolePermissions });
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
}
